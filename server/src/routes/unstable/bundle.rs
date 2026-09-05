use std::{collections::HashMap, sync::Arc};

use anyhow::anyhow;
use axum::{extract::State, response::IntoResponse, Json};
use blake3::{Hash, Hasher};
use serde::{Deserialize, Serialize};
use solpg_server::{
    package::{get_out_path, BUNDLE_FILE, LOCK_FILE, MANIFEST_FILE, PACKAGES_DIR, TYPES_FILE},
    utils::{get_image_name, Files},
    Result, Sandbox,
};
use tokio::{
    fs,
    process::Command,
    sync::{Mutex, OwnedSemaphorePermit, Semaphore},
};

#[derive(Deserialize)]
pub struct BundleRequest {
    /// Package manifest (`package.json`)
    manifest: String,
    /// Lock file
    lock: Option<String>,
}

#[derive(Serialize)]
struct BundleResponse {
    /// Bundle files
    bundle: Files,
    /// Type declaration files
    types: Files,
    /// Package manifest (`package.json`)
    manifest: String,
    /// Lock file
    lock: String,
}

/// Bundle state
#[derive(Clone, Default)]
pub struct BundleState {
    /// Permits for sequential processing based on hash
    permits: Arc<Mutex<HashMap<Hash, Arc<Semaphore>>>>,
}

impl BundleState {
    /// Acquire a sequential processing permit for the given hash.
    async fn acquire_sequential(&self, hash: Hash) -> Result<OwnedSemaphorePermit> {
        let mut permits = self.permits.lock().await;
        let semaphore = permits
            .entry(hash)
            .or_insert_with(|| Arc::new(Semaphore::new(1)))
            .clone();
        drop(permits);

        let permit = semaphore
            .acquire_owned()
            .await
            .map_err(|e| anyhow!("Semaphore is closed: {e}"))?;
        Ok(permit)
    }
}

/// Bundle ESM packages.
pub async fn bundle(
    State(state): State<BundleState>,
    Json(payload): Json<BundleRequest>,
) -> Result<impl IntoResponse> {
    let hash = {
        let mut hasher = Hasher::new();
        hasher.update(payload.manifest.as_bytes());
        if let Some(lock) = &payload.lock {
            hasher.update(lock.as_bytes());
        }
        hasher.finalize()
    };

    // No concurrent builds for the same hash to avoid potential conflicts
    let _permit = state.acquire_sequential(hash).await?;

    let container_path = get_out_path();
    let host_path = container_path.join(hash.to_string());
    let is_cached = fs::try_exists(&host_path)
        .await
        .map_err(|e| anyhow!("Failed to read host dir: {host_path:?}: {e}"))?;
    if !is_cached {
        let temp_host_path = container_path.join(format!("temp-{hash}"));
        fs::create_dir_all(&temp_host_path)
            .await
            .map_err(|e| anyhow!("Failed to create host dir: {temp_host_path:?}: {e}"))?;

        let manifest_path = temp_host_path.join(MANIFEST_FILE);
        fs::write(&manifest_path, &payload.manifest)
            .await
            .map_err(|e| anyhow!("Failed to write manifest file: {e}"))?;

        let lock_path = temp_host_path.join(LOCK_FILE);
        if let Some(lock) = &payload.lock {
            fs::write(&lock_path, lock)
                .await
                .map_err(|e| anyhow!("Failed to write lock file: {e}"))?;
        }

        let output = Sandbox::new()
            .image(get_image_name("bundle"))
            .user("solpg")
            // TODO: Set limits from config
            .cpu_limit(4) // diminishing returns after 4
            .memory_limit(4 * 1024 * 1024 * 1024) // 4 GiB (also affects speed)
            .process_limit(64)
            .timeout(300)
            .copy(
                format!("{}/.", temp_host_path.display()),
                format!("container:{PACKAGES_DIR}"),
            )
            .command(&Command::new("bundle"))
            .copy(
                format!("container:{}/.", container_path.display()),
                &temp_host_path,
            )
            .run()
            .await?;

        if !output.status.success() {
            return Err(anyhow!(
                "Failed to generate bundle: {}\n{}",
                str::from_utf8(&output.stdout)
                    .map_err(|e| anyhow!("Invalid bundle stdout: {e}"))?,
                str::from_utf8(&output.stderr)
                    .map_err(|e| anyhow!("Invalid bundle stderr: {e}"))?
            ))?;
        }

        fs::rename(temp_host_path, &host_path)
            .await
            .map_err(|e| anyhow!("Failed to rename host: {e}"))?;
    }

    let bundle_path = host_path.join(BUNDLE_FILE);
    let bundle = fs::read(bundle_path)
        .await
        .map_err(|e| anyhow!("Could not get bundle: {e}"))
        .map(|b| serde_json::from_slice::<Files>(&b))?
        .map_err(|e| anyhow!("Unexpected files for bundle: {e}"))?;

    let types_path = host_path.join(TYPES_FILE);
    let types = fs::read(types_path)
        .await
        .map_err(|e| anyhow!("Could not get files: {e}"))
        .map(|b| serde_json::from_slice::<Files>(&b))?
        .map_err(|e| anyhow!("Unexpected files for types: {e}"))?;

    let manifest_path = host_path.join(MANIFEST_FILE);
    let manifest = fs::read_to_string(manifest_path)
        .await
        .map_err(|e| anyhow!("Could not get manifest: {e}"))?;

    let lock_path = host_path.join(LOCK_FILE);
    let lock = fs::read_to_string(lock_path)
        .await
        .map_err(|e| anyhow!("Could not get lock file: {e}"))?;

    Ok(Json(BundleResponse {
        bundle,
        types,
        manifest,
        lock,
    }))
}
