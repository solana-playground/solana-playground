use std::{
    sync::{Arc, LazyLock},
    time::Duration,
};

use anyhow::{anyhow, Result};
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
};
use regex::Regex;
use serde::Deserialize;
use serde_json::{json, Value};
use solpg_server::{
    log::{error, info, warn},
    lsp::{encode_frame, FrameDecoder, Limits, LspSession},
    program::{MAX_FILE_AMOUNT, MAX_PATH_LEN},
    templates::{get_all_templates, Template},
    utils::{get_image_name, Files},
};
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    sync::Semaphore,
    time::{interval, sleep_until, timeout, Instant},
};

use crate::middlewares::is_allowed_origin;

// Methods the bridge answers itself; everything else goes to the language server
const OPEN_METHOD: &str = "solpg/open";
const SYNC_METHOD: &str = "solpg/sync";

/// How often to ping the client so that proxies keep an idle socket open
const PING_INTERVAL: Duration = Duration::from_secs(30);

/// How long the client has to send `solpg/open` after connecting
const OPEN_TIMEOUT: Duration = Duration::from_secs(30);

/// Buffered outgoing bytes after which a session with a stalled reader ends
const MAX_WRITE_BUFFER: usize = 16 * 1024 * 1024;

/// Language server state shared between sessions
#[derive(Clone)]
pub struct LspState {
    /// Limits the number of concurrent sessions
    sem: Arc<Semaphore>,
    /// Per-container limits
    limits: Limits,
    /// Origins allowed to open a session (browsers do not apply CORS to WebSockets)
    origins: Arc<[String]>,
}

impl LspState {
    /// Create a new state with the maximum amount of concurrent sessions.
    pub fn new(concurrency: usize, limits: Limits, origins: Vec<String>) -> Self {
        Self {
            sem: Arc::new(Semaphore::new(concurrency)),
            limits,
            origins: origins.into(),
        }
    }
}

/// JSON-RPC message from the client
#[derive(Deserialize)]
struct Incoming {
    id: Option<Value>,
    method: Option<String>,
    #[serde(default)]
    params: Value,
}

/// `solpg/open` and `solpg/sync` parameters
#[derive(Deserialize)]
struct FilesParams {
    files: Files,
}

/// Upgrade to a WebSocket that bridges the client to `rust-analyzer`.
pub async fn lsp(
    ws: WebSocketUpgrade,
    headers: HeaderMap,
    State(state): State<LspState>,
) -> Response {
    let origin = headers
        .get("origin")
        .and_then(|v| v.to_str().ok())
        .unwrap_or_default();
    if !is_allowed_origin(origin.as_bytes(), &state.origins) {
        return (StatusCode::FORBIDDEN, "Origin not allowed").into_response();
    }

    // Incoming frames carry at most the project files plus JSON escaping
    ws.max_message_size(2 * state.limits.max_files_bytes + 64 * 1024)
        .max_write_buffer_size(MAX_WRITE_BUFFER)
        .on_upgrade(move |socket| async move {
            if let Err(e) = handle(socket, state).await {
                error!("LSP session failed: {e}");
            }
        })
}

/// Run one session: wait for `solpg/open`, start the container, pump messages.
async fn handle(mut socket: WebSocket, state: LspState) -> Result<()> {
    // Nothing is served until `solpg/open` arrives, and the deadline keeps
    // parked sockets from piling up before the concurrency permit applies
    let opened = timeout(OPEN_TIMEOUT, wait_for_open(&mut socket, &state)).await;
    let Ok(opened) = opened else { return Ok(()) };
    let Some((open_id, files)) = opened? else {
        return Ok(());
    };

    let Ok(_permit) = state.sem.try_acquire() else {
        send_error(&mut socket, open_id, "Too many language server sessions").await?;
        return Ok(());
    };

    let template = match find_template(&files) {
        Ok(template) => template,
        Err(e) => {
            send_error(&mut socket, open_id, &e.to_string()).await?;
            return Ok(());
        }
    };
    let image = get_image_name(format!("program-{}", template.name()));
    info!("Starting language server using image: {image}");

    let session = LspSession::start(template, &image).await?;
    let result = run(
        &mut socket,
        &session,
        &state.limits,
        open_id,
        &files,
        template.name(),
    )
    .await;
    session.stop().await;
    result
}

/// Wait for `solpg/open`; `None` means the client went away or sent bad files.
async fn wait_for_open(
    socket: &mut WebSocket,
    state: &LspState,
) -> Result<Option<(Value, Files)>> {
    loop {
        let Some(msg) = socket.recv().await else {
            return Ok(None);
        };
        let Message::Text(text) = msg? else { continue };
        let incoming: Incoming = serde_json::from_str(&text)?;
        let id = incoming.id.unwrap_or(Value::Null);
        match incoming.method.as_deref() {
            Some(OPEN_METHOD) => match parse_files(incoming.params, &state.limits) {
                Ok(files) => return Ok(Some((id, files))),
                Err(e) => {
                    send_error(socket, id, &e.to_string()).await?;
                    return Ok(None);
                }
            },
            _ => send_error(socket, id, "Send `solpg/open` first").await?,
        }
    }
}

/// Bridge the socket and the language server until either side goes away.
async fn run(
    socket: &mut WebSocket,
    session: &LspSession,
    limits: &Limits,
    open_id: Value,
    files: &Files,
    template_name: &str,
) -> Result<()> {
    session.write_files(files).await?;
    let mut server = session.spawn_server()?;
    let mut stdin = server.stdin.take().ok_or_else(|| anyhow!("No stdin"))?;
    let mut stdout = server.stdout.take().ok_or_else(|| anyhow!("No stdout"))?;

    send_result(
        socket,
        open_id,
        json!({
            "rootUri": session.root_uri(),
            "programPath": session.program_path(),
            "template": template_name,
        }),
    )
    .await?;

    let mut decoder = FrameDecoder::default();
    let mut chunk = vec![0u8; 64 * 1024];
    let started = Instant::now();
    let mut idle_deadline = started + limits.idle_timeout;
    let mut ping = interval(PING_INTERVAL);
    ping.tick().await;

    // Requests are handled one at a time on purpose: a `sync` must finish
    // before the following `didSave` reaches the server
    let reason = loop {
        tokio::select! {
            msg = socket.recv() => {
                let Some(msg) = msg else { break "client disconnected" };
                match msg? {
                    Message::Text(text) => {
                        // Only real traffic counts as activity: the browser
                        // auto-answers the keepalive pings, so a pong must not
                        // defeat the idle timeout
                        idle_deadline = Instant::now() + limits.idle_timeout;
                        if is_method(&text, SYNC_METHOD) {
                            let incoming: Incoming = serde_json::from_str(&text)?;
                            let id = incoming.id.unwrap_or(Value::Null);
                            match parse_files(incoming.params, limits) {
                                Ok(files) => match session.write_files(&files).await {
                                    Ok(()) => send_result(socket, id, Value::Null).await?,
                                    Err(e) => send_error(socket, id, &e.to_string()).await?,
                                },
                                Err(e) => send_error(socket, id, &e.to_string()).await?,
                            }
                        } else {
                            stdin.write_all(&encode_frame(text.as_bytes())).await?;
                        }
                    }
                    Message::Close(_) => break "client closed",
                    _ => {}
                }
            }
            read = stdout.read(&mut chunk) => {
                let n = read?;
                if n == 0 { break "language server exited" }
                decoder.push(&chunk[..n]);
                while let Some(body) = decoder.pop()? {
                    socket.send(Message::Text(String::from_utf8(body)?.into())).await?;
                }
            }
            _ = ping.tick() => {
                socket.send(Message::Ping(Default::default())).await?;
            }
            _ = sleep_until(idle_deadline) => break "idle timeout",
            _ = sleep_until(started + limits.max_lifetime) => break "max lifetime",
        }
    };

    server.kill().await.ok();
    match server.wait().await {
        Ok(status) => info!("Language server session ended ({reason}), server: {status}"),
        Err(e) => warn!("Language server session ended ({reason}), server: {e}"),
    }
    socket.send(Message::Close(None)).await.ok();
    Ok(())
}

/// Cheap check for a bridge method before parsing a (possibly large) message.
fn is_method(text: &str, method: &str) -> bool {
    text.contains(method)
        && serde_json::from_str::<Incoming>(text)
            .map(|msg| msg.method.as_deref() == Some(method))
            .unwrap_or(false)
}

/// Parse and validate the files of an `open`/`sync` request.
fn parse_files(params: Value, limits: &Limits) -> Result<Files> {
    let params: FilesParams =
        serde_json::from_value(params).map_err(|e| anyhow!("Invalid files: {e}"))?;
    validate(&params.files, limits)?;
    Ok(params.files)
}

/// Check file count, size and paths the same way `unstable/build` does.
fn validate(files: &Files, limits: &Limits) -> Result<()> {
    if files.len() > MAX_FILE_AMOUNT {
        return Err(anyhow!(
            "Exceeded maximum file amount: {} > {MAX_FILE_AMOUNT}",
            files.len()
        ));
    }

    let bytes: usize = files.iter().map(|(_, content)| content.len()).sum();
    if bytes > limits.max_files_bytes {
        return Err(anyhow!(
            "Exceeded maximum project size: {bytes} > {}",
            limits.max_files_bytes
        ));
    }

    static SRC_REGEX: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"^src/[\w/-]+\.rs$").unwrap());
    static CARGO_REGEX: LazyLock<Regex> =
        LazyLock::new(|| Regex::new(r"^Cargo.(toml|lock)$").unwrap());
    for (path, _) in files {
        let is_valid = path.len() <= MAX_PATH_LEN
            && !path.contains("..")
            && !path.contains("//")
            && (SRC_REGEX.is_match(path) || CARGO_REGEX.is_match(path));
        if !is_valid {
            return Err(anyhow!("Invalid path: {path}"));
        }
    }

    Ok(())
}

/// Pick the template from the `cargo` files, the default one if there are none.
///
/// A manifest without a lock matches against the template manifest alone.
fn find_template(files: &Files) -> Result<&'static Template> {
    let manifest = files.iter().find(|(p, _)| p == "Cargo.toml");
    let lock = files.iter().find(|(p, _)| p == "Cargo.lock");
    match (manifest, lock) {
        // Pre-template projects have no `cargo` files; they run on `legacy`
        (None, None) => Ok(Default::default()),
        (None, Some(_)) => Err(anyhow!("Missing `Cargo.toml`")),
        (Some((_, manifest)), lock) => {
            let lock = lock.map(|(_, content)| content.as_str());
            for template in get_all_templates() {
                if template.matches(manifest, lock)? {
                    return Ok(template);
                }
            }
            Err(anyhow!(
                "The `cargo` files match no build template: the dependency set \
                is fixed by the build images. Revert `Cargo.toml` to restore \
                builds and intellisense"
            ))
        }
    }
}

async fn send_result(socket: &mut WebSocket, id: Value, result: Value) -> Result<()> {
    let msg = json!({ "jsonrpc": "2.0", "id": id, "result": result });
    socket.send(Message::Text(msg.to_string().into())).await?;
    Ok(())
}

async fn send_error(socket: &mut WebSocket, id: Value, message: &str) -> Result<()> {
    let msg = json!({
        "jsonrpc": "2.0",
        "id": id,
        "error": { "code": -32000, "message": message },
    });
    socket.send(Message::Text(msg.to_string().into())).await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn files(paths: &[&str]) -> Files {
        paths
            .iter()
            .map(|p| (p.to_string(), String::new()))
            .collect()
    }

    #[test]
    fn detects_bridge_methods_only_by_method_field() {
        assert!(is_method(
            r#"{"jsonrpc":"2.0","method":"solpg/sync","params":{"files":[]}}"#,
            SYNC_METHOD
        ));
        // The method name inside a document must not be mistaken for a call
        assert!(!is_method(
            r#"{"jsonrpc":"2.0","method":"textDocument/didChange","params":{"text":"solpg/sync"}}"#,
            SYNC_METHOD
        ));
    }

    #[test]
    fn validates_paths() {
        let limits = Limits::default();
        let ok = files(&["src/lib.rs", "src/state/mod.rs", "Cargo.toml"]);
        assert!(validate(&ok, &limits).is_ok());

        for bad in [
            "/src/lib.rs",
            "src/../etc/passwd",
            "tests/x.rs",
            "src//a.rs",
            "src/my mod.rs",
        ] {
            assert!(validate(&files(&[bad]), &limits).is_err(), "{bad}");
        }
    }

    #[test]
    fn validates_size() {
        let limits = Limits {
            max_files_bytes: 8,
            ..Default::default()
        };
        let small: Files = vec![("src/lib.rs".to_owned(), "fn x(){}".to_owned())]
            .into_iter()
            .collect();
        assert!(validate(&small, &limits).is_ok());
        let big: Files = vec![("src/lib.rs".to_owned(), "fn xx(){}".to_owned())]
            .into_iter()
            .collect();
        assert!(validate(&big, &limits).is_err());
    }
}
