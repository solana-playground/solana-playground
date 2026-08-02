use anyhow::anyhow;
use axum::{extract::Path, response::IntoResponse, Json};
use serde::Serialize;
use solpg_server::{
    package::{get_build_path, get_package_out_type_dependencies_path, get_package_out_types_path},
    utils::Files,
    Result, Sandbox,
};
use tokio::{fs, io, process::Command};

/// Types response
#[derive(Serialize)]
struct TypesResponse {
    /// Type declaration files, see [`Files`]
    files: Files,
    /// List of the type dependencies
    dependencies: Vec<String>,
}

/// Get type TypeScript declaration files and type dependencies.
// TODO: Concurrency limit
pub async fn types(Path(name): Path<String>) -> Result<impl IntoResponse> {
    match read_types(&name).await {
        Err(e) if e.kind() == tokio::io::ErrorKind::NotFound => generate_types(&name).await,
        res => res.map_err(|e| anyhow!("Unexpected error ({name}): {e}")),
    }
    .map(|(files, dependencies)| TypesResponse {
        files,
        dependencies,
    })
    .map(Json)
    .map_err(Into::into)
}

/// Read the generated types file.
///
/// Types can only exist if the [`generate_types`] function has been run beforehand.
async fn read_types(name: &str) -> io::Result<(Files, Vec<String>)> {
    let types_path = get_package_out_types_path(name);
    let deps_path = get_package_out_type_dependencies_path(name);
    let types = fs::read(types_path)
        .await
        .map(|b| serde_json::from_slice(&b))??;
    let deps = fs::read(deps_path)
        .await
        .map(|b| serde_json::from_slice(&b))??;
    Ok((types, deps))
}

async fn generate_types(name: &str) -> anyhow::Result<(Files, Vec<String>)> {
    let build_path = get_build_path();
    // TODO: Set limits from config
    let output = Sandbox::new()
        .image("solpg-server-sandbox-types")
        .user("solpg")
        .cpu_limit(1)
        .memory_limit(1024 * 1024 * 1024) // 1 GiB
        .process_limit(64)
        .timeout(10)
        .command(Command::new("types").arg(name).arg(&build_path))
        .copy(format!("container:{}/.", build_path.display()), &build_path)
        .run()
        .await?;

    if !output.status.success() {
        return Err(anyhow!(
            "Failed to generate types: `{name}`: {}",
            str::from_utf8(&output.stderr)?
        ));
    }

    read_types(name).await.map_err(Into::into)
}
