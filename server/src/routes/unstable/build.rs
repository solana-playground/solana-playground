use std::{path::Path, sync::Arc};

use anyhow::anyhow;
use axum::{
    extract::{Json, State},
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use solpg_server::{
    log::info,
    program::{get_out_path, is_cargo_file, validate_files, BINARY_FILE, MAX_STDERR_LEN},
    templates::Template,
    utils::{get_image_name, Files},
    Result, Sandbox,
};
use tokio::{fs, io, process::Command};
use uuid::Uuid;

use crate::config::BuildConfig;

/// Input directory name
const INPUT_DIR: &str = "in";

/// Output directory name
const OUTPUT_DIR: &str = "out";

/// Build files name
const FILES_FILE: &str = "files.json";

/// IDL file name
const IDL_FILE: &str = "idl.json";

/// Maximum program build output stdout length
const MAX_STDOUT_LEN: usize = 1024 * 1024 * 1024; // 1 MiB

/// Build request
#[derive(Deserialize)]
pub struct BuildRequest {
    /// Program files to build
    files: Files,
    /// UUID of the program.
    ///
    /// In the first ever request from a client, this will not exist and [`BuildResponse`] will
    /// return a `uuid`. Client is responsible for saving the `uuid` and using it with every
    /// subseqent requests in order to save resources and be able to get the program binary.
    uuid: Option<String>,
    /// Arguments to pass to the build command
    args: Option<Vec<String>>,
}

/// Build response
#[derive(Serialize)]
struct BuildResponse {
    /// Whether the build was successful
    success: bool,
    /// Build output to `stdout` regardless of the compilation status
    stdout: String,
    /// Build output to `stderr` regardless of the compilation status (main output)
    stderr: String,
    /// UUID of the program, `None` if the [`BuildRequest`] includes `uuid`
    uuid: Option<String>,
    /// IDL of the program
    idl: Option<serde_json::Value>,
}

/// Build state
#[derive(Clone)]
pub struct BuildState {
    /// Build configuration
    config: Arc<BuildConfig>,
}

impl BuildState {
    /// Create build state.
    pub fn new(config: BuildConfig) -> Self {
        Self {
            config: Arc::new(config),
        }
    }
}

/// Build the program.
pub async fn build(
    State(state): State<BuildState>,
    Json(payload): Json<BuildRequest>,
) -> Result<impl IntoResponse> {
    let (uuid, respond_with_uuid) = match payload.uuid {
        Some(uuid) => Uuid::try_parse(&uuid)
            .map(|_| (uuid, false))
            .map_err(|_| anyhow!("Invalid UUID"))?,
        None => (Uuid::new_v4().to_string(), true),
    };

    // Strip the legacy `/` prefix, then validate count and paths
    let files: Files = payload
        .files
        .into_iter()
        .map(|(path, content)| {
            let path = path
                .strip_prefix('/')
                .map(ToOwned::to_owned)
                .unwrap_or(path);
            (path, content)
        })
        .collect();
    validate_files(&files, None)?;

    // Split the `cargo` files out; they pick the build template
    let (cargo_files, files): (Files, Files) =
        files.into_iter().partition(|(path, _)| is_cargo_file(path));

    // Create host output directory (if it doesn't exist)
    let host_path = get_out_path(&uuid);
    fs::create_dir_all(&host_path)
        .await
        .map_err(|e| anyhow!("Failed to create host dir: {host_path:?}: {e}"))?;

    // Write the files as a file so that the container can read it
    fs::write(
        host_path.join(FILES_FILE),
        serde_json::to_string(&files).map_err(|e| anyhow!("Invalid build files: {e}"))?,
    )
    .await
    .map_err(|e| anyhow!("Failed to write build files: {e}"))?;

    let template_name = Template::find(&cargo_files)?.name();
    let image = get_image_name(format!("program-{template_name}"));
    info!("Building using image: {image}");

    // Container paths
    let input_path = Path::new(INPUT_DIR);
    let output_path = Path::new(OUTPUT_DIR);
    let input_files_path = input_path.join(FILES_FILE);
    let output_binary_path = output_path.join(BINARY_FILE);
    let output_idl_path = output_path.join(IDL_FILE);

    // Sandboxed build
    let output = Sandbox::new()
        .image(image)
        .user("solpg")
        .limits(state.config.limits.sandbox)
        .copy(
            format!("{}/.", host_path.display()),
            format!("container:{}", input_path.display()),
        )
        .command(
            Command::new("build-program")
                .arg(template_name)
                .arg(input_files_path)
                .arg(output_binary_path)
                .arg(output_idl_path)
                .args(payload.args.unwrap_or_default()),
        )
        // Make sure the output directory always exists so that the following copy always works
        .command(Command::new("mkdir").arg("-p").arg(output_path))
        .copy(format!("container:{}/.", output_path.display()), &host_path)
        .run()
        .await?;

    // Check output length
    if output.stdout.len() > MAX_STDOUT_LEN || output.stderr.len() > MAX_STDERR_LEN {
        return Err(anyhow!("Exceeded maximum build output length"))?;
    }

    // Check unexpected build process errors (not regular compilation errors)
    let success = output.status.success();
    if !success {
        return Err(anyhow!(
            "Failed to build: {}",
            str::from_utf8(&output.stderr).map_err(|e| anyhow!("Invalid build output: {e}"))?
        ))?;
    }

    let stdout = String::from_utf8(output.stdout)
        .map_err(|e| anyhow!("Failed to convert stdout output to UTF-8: {e}"))?;
    let stderr = String::from_utf8(output.stderr)
        .map_err(|e| anyhow!("Failed to convert stderr output to UTF-8: {e}"))?;

    let idl = match fs::read(host_path.join(IDL_FILE)).await {
        Ok(b) => serde_json::from_slice(&b).map_err(|e| anyhow!("Invalid IDL: {e}"))?,
        Err(e) if e.kind() == io::ErrorKind::NotFound => None,
        Err(e) => return Err(anyhow!("Failed to read IDL file: {e}"))?,
    };

    Ok(Json(BuildResponse {
        success,
        stdout,
        stderr,
        uuid: respond_with_uuid.then_some(uuid),
        idl,
    }))
}
