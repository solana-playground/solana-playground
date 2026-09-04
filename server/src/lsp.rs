//! Long-lived language server sessions inside the template images.
//!
//! A build runs a container for seconds; a language server session lives as
//! long as the editor is open and streams stdio, which is why this is a
//! separate small type rather than a mode of [`crate::Sandbox`].

use std::{
    path::{Path, PathBuf},
    process::Stdio,
    time::Duration,
};

use anyhow::{anyhow, Result};
use tokio::{
    fs,
    io::AsyncWriteExt,
    process::{Child, Command},
};
use uuid::Uuid;

use crate::{templates::Template, utils::Files};

/// User inside the program images
const USER: &str = "solpg";

/// Label on session containers, to find leftovers after a crash:
/// `docker ps --filter label=solpg.lsp`
const LABEL: &str = "solpg.lsp";

/// Resource limits of a language server container
#[derive(Debug, Clone)]
pub struct Limits {
    /// CPU (cores) limit
    pub cpu: usize,
    /// Memory limit in bytes
    pub memory: usize,
    /// Process (PIDs) limit
    pub pids: usize,
    /// Session is closed after this long without a client message
    pub idle_timeout: Duration,
    /// Session is closed after this long no matter what
    pub max_lifetime: Duration,
    /// Total bytes of project files accepted in one `open`/`sync`
    pub max_files_bytes: usize,
}

impl Default for Limits {
    fn default() -> Self {
        Self {
            cpu: 1,
            memory: 4 * 1024 * 1024 * 1024, // 4 GiB: `cargo check` on an Anchor program
            pids: 256,
            idle_timeout: Duration::from_secs(10 * 60),
            max_lifetime: Duration::from_secs(4 * 60 * 60),
            max_files_bytes: 1024 * 1024,
        }
    }
}

/// Kill session containers left over by a previous server process.
///
/// A session container is removed when its socket closes; if the server itself
/// dies first, the container outlives it. Sessions cannot survive a server
/// restart anyway, so on startup everything with the session label goes.
pub async fn kill_leftovers() -> Result<usize> {
    let output = Command::new("docker")
        .args(["ps", "--quiet", "--filter", &format!("label={LABEL}")])
        .output()
        .await?;
    if !output.status.success() {
        return Err(anyhow!(
            "Failed to list language server containers: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    let ids: Vec<&str> = std::str::from_utf8(&output.stdout)?
        .lines()
        .filter(|line| !line.is_empty())
        .collect();
    if !ids.is_empty() {
        run(Command::new("docker").arg("kill").args(&ids)).await?;
    }
    Ok(ids.len())
}

/// A running container with the project written over the template
pub struct LspSession {
    /// Container name
    container: String,
    /// Absolute path of the project (template) root inside the container
    root: PathBuf,
    /// Program directory relative to the root (from the template)
    program_path: PathBuf,
    /// Host directory the files are staged in before being sent
    host_dir: PathBuf,
}

impl LspSession {
    /// Start a container from the template's program image.
    ///
    /// The container idles until [`LspSession::spawn_server`] is called.
    pub async fn start(template: &Template, image: &str, limits: &Limits) -> Result<Self> {
        const NAME_PREFIX: &str = concat!(env!("CARGO_PKG_NAME"), "-lsp");
        let id = Uuid::new_v4();
        let container = format!("{NAME_PREFIX}-{id}");

        let host_dir = std::env::temp_dir().join(&container);
        fs::create_dir_all(&host_dir).await?;

        // Same hardening as `Sandbox`; the container user is the image user, so
        // nothing below needs capabilities `--cap-drop=ALL` removes
        let mut cmd = Command::new("docker");
        cmd.arg("run")
            .arg("--name")
            .arg(&container)
            .arg("--detach")
            .arg("--rm")
            .arg("--cap-drop=ALL")
            .arg("--memory-swap=-1")
            .arg("--network=none")
            .arg("--oom-score-adj=1000")
            .arg("--security-opt=no-new-privileges")
            .args(["--label", LABEL])
            .args(["--user", USER])
            .args(["--cpus", &limits.cpu.to_string()])
            .args(["--memory", &format!("{}b", limits.memory)])
            .args(["--pids-limit", &limits.pids.to_string()])
            .arg(image)
            .args(["sh", "-lc", "sleep infinity"]);
        run(&mut cmd).await?;

        let session = Self {
            container,
            root: PathBuf::new(),
            program_path: template.program_path().to_path_buf(),
            host_dir,
        };

        // Container paths must be absolute; resolve the image's `WORKDIR`
        let root = match session.exec(["pwd"], None).await {
            Ok(output) => PathBuf::from(output.trim()),
            Err(e) => {
                session.stop().await;
                return Err(e);
            }
        };

        Ok(Self { root, ..session })
    }

    /// URI of the project root inside the container.
    pub fn root_uri(&self) -> String {
        format!("file://{}", self.root.display())
    }

    /// Program directory relative to the root.
    pub fn program_path(&self) -> &Path {
        &self.program_path
    }

    /// Write the project sources over the template's.
    ///
    /// Only `src/` is written: the `cargo` files already match the template,
    /// that is how the template was chosen. The tree is shipped as a tar stream
    /// and unpacked by the container user, so the files end up owned by that
    /// user without needing `root` (whose capabilities are dropped anyway).
    pub async fn write_files(&self, files: &Files) -> Result<()> {
        let src_dir = self.host_dir.join("src");
        if fs::try_exists(&src_dir).await? {
            fs::remove_dir_all(&src_dir).await?;
        }
        fs::create_dir_all(&src_dir).await?;

        for (path, content) in files {
            let Some(relative) = path.strip_prefix("src/") else {
                continue;
            };
            let host_path = src_dir.join(relative);
            if let Some(parent) = host_path.parent() {
                fs::create_dir_all(parent).await?;
            }
            fs::write(host_path, content).await?;
        }

        let tar = Command::new("tar")
            // No AppleDouble `._*` entries when the server runs on macOS
            .env("COPYFILE_DISABLE", "1")
            .args(["-cf", "-", "-C"])
            .arg(&src_dir)
            .arg(".")
            .output()
            .await?;
        if !tar.status.success() {
            return Err(anyhow!(
                "Failed to archive sources: {}",
                String::from_utf8_lossy(&tar.stderr)
            ));
        }

        let container_src = self.root.join(&self.program_path).join("src");
        let script = format!(
            "rm -rf '{0}' && mkdir -p '{0}' && tar -xf - -C '{0}'",
            container_src.display()
        );
        self.exec(["sh", "-c", &script], Some(&tar.stdout)).await?;

        Ok(())
    }

    /// Spawn `rust-analyzer` in the container with piped stdin/stdout.
    ///
    /// Its stderr (rust-analyzer's own log) goes to the server's stderr.
    pub fn spawn_server(&self) -> Result<Child> {
        Command::new("docker")
            .arg("exec")
            .arg("--interactive")
            .arg("--workdir")
            .arg(&self.root)
            .arg(&self.container)
            .arg("rust-analyzer")
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit())
            .kill_on_drop(true)
            .spawn()
            .map_err(|e| anyhow!("Failed to start the language server: {e}"))
    }

    /// Kill the container (removed automatically thanks to `--rm`) and clean up.
    pub async fn stop(self) {
        run(Command::new("docker").arg("kill").arg(&self.container))
            .await
            .ok();
        fs::remove_dir_all(&self.host_dir).await.ok();
    }

    /// Run a command in the container as the container user, optionally
    /// feeding `stdin`, and return its `stdout`.
    async fn exec<const N: usize>(&self, args: [&str; N], stdin: Option<&[u8]>) -> Result<String> {
        let mut child = Command::new("docker")
            .arg("exec")
            .arg("--interactive")
            .arg(&self.container)
            .args(args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()?;

        let mut input = child.stdin.take().ok_or_else(|| anyhow!("No stdin"))?;
        if let Some(bytes) = stdin {
            input.write_all(bytes).await?;
        }
        drop(input);

        let output = child.wait_with_output().await?;
        if !output.status.success() {
            return Err(anyhow!(
                "`docker exec {}` failed: {}",
                args.join(" "),
                String::from_utf8_lossy(&output.stderr)
            ));
        }
        Ok(String::from_utf8(output.stdout)?)
    }
}

/// Run a `docker` command to completion, failing on a non-zero status.
async fn run(cmd: &mut Command) -> Result<()> {
    let output = cmd.output().await?;
    if !output.status.success() {
        return Err(anyhow!(
            "`{:?}` failed: {}",
            cmd.as_std(),
            String::from_utf8_lossy(&output.stderr)
        ));
    }
    Ok(())
}

/// Language server stdio uses `Content-Length` framing; the WebSocket carries
/// one bare JSON message per frame.
pub fn encode_frame(body: &[u8]) -> Vec<u8> {
    let mut frame = format!("Content-Length: {}\r\n\r\n", body.len()).into_bytes();
    frame.extend_from_slice(body);
    frame
}

/// Incremental decoder of `Content-Length` framed messages.
#[derive(Debug, Default)]
pub struct FrameDecoder {
    buf: Vec<u8>,
    /// Where the search for the header terminator resumes
    scanned: usize,
}

impl FrameDecoder {
    /// Append bytes read from the server's `stdout`.
    pub fn push(&mut self, bytes: &[u8]) {
        self.buf.extend_from_slice(bytes);
    }

    /// Take the next complete message body, if any.
    ///
    /// # Errors
    ///
    /// A header block without a valid `Content-Length` is unrecoverable: the
    /// stream is desynchronized and the session should end.
    pub fn pop(&mut self) -> Result<Option<Vec<u8>>> {
        const SEPARATOR: &[u8] = b"\r\n\r\n";

        let Some(header_end) = self.buf[self.scanned..]
            .windows(SEPARATOR.len())
            .position(|window| window == SEPARATOR)
            .map(|pos| pos + self.scanned)
        else {
            // Resume after the last bytes that could not be a full separator
            self.scanned = self.buf.len().saturating_sub(SEPARATOR.len() - 1);
            return Ok(None);
        };

        let length = std::str::from_utf8(&self.buf[..header_end])
            .ok()
            .and_then(|header| {
                header
                    .lines()
                    .find_map(|line| line.strip_prefix("Content-Length:"))
                    .and_then(|value| value.trim().parse::<usize>().ok())
            })
            .ok_or_else(|| anyhow!("Invalid language server message header"))?;

        let body_start = header_end + SEPARATOR.len();
        let body_end = body_start + length;
        if self.buf.len() < body_end {
            // Header is complete; only the body is pending
            self.scanned = header_end;
            return Ok(None);
        }

        let body = self.buf[body_start..body_end].to_vec();
        self.buf.drain(..body_end);
        self.scanned = 0;
        Ok(Some(body))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encodes_frames() {
        assert_eq!(
            encode_frame(br#"{"a":1}"#),
            b"Content-Length: 7\r\n\r\n{\"a\":1}"
        );
    }

    #[test]
    fn decodes_split_and_batched_frames() {
        let mut decoder = FrameDecoder::default();
        decoder.push(b"Content-Length: 2\r\n\r\n{");
        assert_eq!(decoder.pop().unwrap(), None);
        decoder.push(b"}Content-Type: application/json\r\nContent-Length: 4\r\n\r\nnull");
        assert_eq!(decoder.pop().unwrap(), Some(b"{}".to_vec()));
        assert_eq!(decoder.pop().unwrap(), Some(b"null".to_vec()));
        assert_eq!(decoder.pop().unwrap(), None);
    }

    #[test]
    fn decodes_a_separator_split_across_pushes() {
        let mut decoder = FrameDecoder::default();
        decoder.push(b"Content-Length: 2\r\n");
        assert_eq!(decoder.pop().unwrap(), None);
        decoder.push(b"\r\n{}");
        assert_eq!(decoder.pop().unwrap(), Some(b"{}".to_vec()));
    }

    #[test]
    fn rejects_headers_without_a_length() {
        let mut decoder = FrameDecoder::default();
        decoder.push(b"Content-Type: application/json\r\n\r\n{}");
        assert!(decoder.pop().is_err());
    }
}
