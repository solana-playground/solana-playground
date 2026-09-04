use std::{path::Path, sync::LazyLock};

use anyhow::anyhow;
use axum::{extract::Json, response::IntoResponse};
use regex::Regex;
use serde::{Deserialize, Serialize};
use solpg_server::{
    log::info,
    program::{get_out_path, BINARY_FILE, MAX_FILE_AMOUNT, MAX_PATH_LEN, MAX_STDERR_LEN},
    templates::get_all_templates,
    utils::{get_image_name, Files},
    Result, Sandbox,
};
use tokio::{fs, io, process::Command};
use uuid::Uuid;

/// Input directory name
const INPUT_DIR: &str = "in";

/// Output directory name
const OUTPUT_DIR: &str = "out";

/// Build files name
const FILES_FILE: &str = "files.json";

/// IDL file name
const IDL_FILE: &str = "idl.json";

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
    /// Solana build tools output to `stderr` regardless of the compilation status
    stderr: String,
    /// UUID of the program, `None` if the [`BuildRequest`] includes `uuid`
    uuid: Option<String>,
    /// IDL of the program
    idl: Option<serde_json::Value>,
}

/// Build the program.
pub async fn build(Json(payload): Json<BuildRequest>) -> Result<impl IntoResponse> {
    let (uuid, respond_with_uuid) = match payload.uuid {
        Some(uuid) => Uuid::try_parse(&uuid)
            .map(|_| (uuid, false))
            .map_err(|_| anyhow!("Invalid UUID"))?,
        None => (Uuid::new_v4().to_string(), true),
    };

    // Check file count
    let files = payload.files;
    if files.len() > MAX_FILE_AMOUNT {
        return Err(anyhow!(
            "Exceeded maximum file amount: {} > {MAX_FILE_AMOUNT}",
            files.len()
        ))?;
    }

    // Check file paths.
    //
    // `/` prefix is no longer necessary and solely exists for backwards-compatibility
    static SRC_REGEX: LazyLock<Regex> =
        LazyLock::new(|| Regex::new(r"^/?src/[\w/-]+\.rs$").unwrap());
    static CARGO_REGEX: LazyLock<Regex> =
        LazyLock::new(|| Regex::new(r"^Cargo.(toml|lock)$").unwrap());
    for (path, _) in &files {
        let is_valid = path.len() <= MAX_PATH_LEN
            && !path.contains("..")
            && !path.contains("//")
            && (SRC_REGEX.is_match(path) || CARGO_REGEX.is_match(path));
        if !is_valid {
            return Err(anyhow!("Invalid path: {path}"))?;
        }
    }

    // Normalize paths (`/` prefix) and split `cargo` files
    let (cargo_files, files) = files
        .into_iter()
        .map(|(path, content)| {
            let path = path
                .strip_prefix('/')
                .map(ToOwned::to_owned)
                .unwrap_or(path);
            (path, content)
        })
        .partition::<Files, _>(|(path, _)| CARGO_REGEX.is_match(path));

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

    // Get which templete to use from the `cargo` files
    let template_name = match cargo_files.len() {
        2 => 'outer: {
            let (manifest, lock) = match cargo_files.as_slice() {
                [(p1, c1), (p2, c2)] if p1 == "Cargo.toml" && p2 == "Cargo.lock" => (c1, c2),
                [(p1, c1), (p2, c2)] if p1 == "Cargo.lock" && p2 == "Cargo.toml" => (c2, c1),
                _ => return Err(anyhow!("Unexpected `cargo` files"))?,
            };

            for template in get_all_templates() {
                if template.matches(manifest, lock)? {
                    break 'outer template;
                }
            }

            return Err(anyhow!("Failed to find a build template"))?;
        }
        0 => Default::default(),
        1 => return Err(anyhow!("Missing `cargo` file"))?,
        _ => return Err(anyhow!("Too many `cargo` files: {}", cargo_files.len()))?,
    }
    .name();
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
        // TODO: Set limits from config
        .cpu_limit(1)
        .memory_limit(2 * 1024 * 1024 * 1024) // 2 GiB
        .process_limit(64)
        .timeout(30)
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
    if output.stderr.len() > MAX_STDERR_LEN {
        return Err(anyhow!(
            "Exceeded maximum build output length: {} > {MAX_STDERR_LEN}",
            output.stderr.len()
        ))?;
    }

    // Check unexpected build process errors (not regular compilation errors)
    if !output.status.success() {
        return Err(anyhow!(
            "Failed to build: {}",
            str::from_utf8(&output.stderr).map_err(|e| anyhow!("Invalid build output: {e}"))?
        ))?;
    }

    let stderr = String::from_utf8(output.stderr)
        .map_err(|e| anyhow!("Failed to convert stderr output to UTF-8: {e}"))?;

    let idl = match fs::read(host_path.join(IDL_FILE)).await {
        Ok(b) => serde_json::from_slice(&b).map_err(|e| anyhow!("Invalid IDL: {e}"))?,
        Err(e) if e.kind() == io::ErrorKind::NotFound => None,
        Err(e) => return Err(anyhow!("Failed to read IDL file: {e}"))?,
    };

    Ok(Json(BuildResponse {
        stderr,
        uuid: respond_with_uuid.then_some(uuid),
        idl,
    }))
}
