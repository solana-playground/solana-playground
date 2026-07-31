use std::path::PathBuf;

use anyhow::anyhow;
use axum::{extract::Path, response::IntoResponse};
use solpg_server::{package::get_package_out_path, Result, Sandbox};
use tokio::{fs, io, process::Command};

/// Get the ESM package bundled into a single file (runtime only; no types).
// TODO: Concurrency limit
pub async fn packages(Path(name): Path<String>) -> Result<impl IntoResponse> {
    match read_package(&name).await {
        Err(e) if e.kind() == io::ErrorKind::NotFound => build_package(&name).await,
        res => res.map_err(|e| anyhow!("Unexpected error: `{name}`: {e}")),
    }
    .map_err(Into::into)
}

/// Read the generated package module file.
///
/// Packages can only exist if the [`build_package`] function has been run beforehand.
async fn read_package(name: &str) -> io::Result<String> {
    let path = get_package_out_file_path(name);
    fs::read_to_string(path).await
}

/// Build the given package in a sandboxed environment.
async fn build_package(name: &str) -> anyhow::Result<String> {
    let out_path = get_package_out_file_path(name);
    // TODO: Make `Sandbox::copy` handle this?
    match out_path.parent() {
        Some(parent) => fs::create_dir_all(parent)
            .await
            .map_err(|e| anyhow!("Failed to create parent path: {parent:?}: {e}"))?,
        _ => return Err(anyhow!("Package out path should always have a parent")),
    }

    // TODO: Set limits from config
    let output = Sandbox::new()
        .image("solpg-server-sandbox-package")
        .user("solpg")
        .cpu_limit(1)
        .memory_limit(1024 * 1024 * 1024) // 1 GiB
        .process_limit(64)
        .timeout(30)
        .command(Command::new("package").arg(name).arg(&out_path))
        .copy(format!("container:{}", out_path.display()), &out_path)
        .run()
        .await?;
    if !output.status.success() {
        return Err(anyhow!(
            "Failed to build package: `{name}`: {}",
            str::from_utf8(&output.stderr)?
        ));
    }

    read_package(name).await.map_err(Into::into)
}

/// Get the path to the output file that stores the package's build in a single file.
fn get_package_out_file_path(name: &str) -> PathBuf {
    get_package_out_path(name).join("module.js")
}
