use anyhow::anyhow;
use axum::{response::IntoResponse, Json};
use serde::{Deserialize, Serialize};
use solpg_server::{
    package::{get_build_path, BUNDLE_FILE, LOCK_FILE, MANIFEST_FILE, PACKAGES_DIR},
    utils::Files,
    Result, Sandbox,
};
use tokio::{fs, process::Command};
use uuid::Uuid;

#[derive(Deserialize)]
pub struct BundleRequest {
    /// Package manifest (`package.json`)
    manifest: String,
    /// Lock file
    lock: Option<String>,
}

#[derive(Serialize)]
struct BundleResponse {
    /// Bundle filess
    bundle: Files,
    /// Package manifest (`package.json`)
    manifest: String,
    /// Lock file
    lock: String,
}

/// Bundle ESM packages.
//
// TODO: Concurrency limit
// TODO: Cache
// TODO: Types
pub async fn bundle(Json(payload): Json<BundleRequest>) -> Result<impl IntoResponse> {
    let uuid = Uuid::new_v4();
    let container_path = get_build_path();
    let host_path = container_path.join(uuid.to_string());
    // TODO: Make `Sandbox::copy` automatically create this
    fs::create_dir_all(&host_path)
        .await
        .map_err(|e| anyhow!("Failed to create host dir: {host_path:?}: {e}"))?;

    let manifest_path = host_path.join(MANIFEST_FILE);
    fs::write(&manifest_path, &payload.manifest)
        .await
        .map_err(|e| anyhow!("Failed to write manifest file: {e}"))?;

    let lock_path = host_path.join(LOCK_FILE);
    if let Some(lock) = &payload.lock {
        fs::write(&lock_path, lock)
            .await
            .map_err(|e| anyhow!("Failed to write lock file: {e}"))?;
    }

    let output = Sandbox::new()
        .image("solpg-server-sandbox-bundle")
        .user("solpg")
        // TODO: Set limits from config
        .cpu_limit(3) // Diminishing returns after 3
        .memory_limit(2 * 1024 * 1024 * 1024) // 2 GiB
        .process_limit(64)
        .timeout(120)
        .copy(
            format!("{}/.", host_path.display()),
            format!("container:{PACKAGES_DIR}"),
        )
        .command(&Command::new("bundle"))
        .copy(
            format!("container:{}/.", container_path.display()),
            &host_path,
        )
        .run()
        .await?;

    if !output.status.success() {
        return Err(anyhow!(
            "Failed to generate bundle: {}\n{}",
            str::from_utf8(&output.stdout).map_err(|e| anyhow!("Invalid bundle stdout: {e}"))?,
            str::from_utf8(&output.stderr).map_err(|e| anyhow!("Invalid bundle stderr: {e}"))?
        ))?;
    }

    let bundle_path = host_path.join(BUNDLE_FILE);
    let bundle = fs::read(bundle_path)
        .await
        .map_err(|e| anyhow!("Could not get bundle: {e}"))
        .map(|b| serde_json::from_slice::<Files>(&b))?
        .map_err(|e| anyhow!("Unexpected files for bundle: {e}"))?;

    let manifest = fs::read_to_string(manifest_path)
        .await
        .map_err(|e| anyhow!("Could not get manifest: {e}"))?;

    let lock = fs::read_to_string(lock_path)
        .await
        .map_err(|e| anyhow!("Could not get lock file: {e}"))?;

    Ok(Json(BundleResponse {
        bundle,
        manifest,
        lock,
    }))
}
