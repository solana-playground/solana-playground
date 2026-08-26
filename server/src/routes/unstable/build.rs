use std::{
    path::Path,
    sync::{Arc, Mutex},
};

use anchor_syn::idl::types::Idl;
use anyhow::anyhow;
use axum::{
    extract::{Json, State},
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use solpg_server::{
    program::{get_out_path, BuildFlags, IDL_FILE, MAX_STDERR_LEN, PROGRAMS_DIR},
    utils::Files,
    Result, Sandbox,
};
use tokio::{fs, io, process::Command, sync::Semaphore};
use uuid::Uuid;

/// Build files name
const BUILD_FILES: &str = "files.json";

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
    /// Build flags
    flags: Option<BuildFlags>,
}

/// Build response
#[derive(Serialize)]
struct BuildResponse {
    /// Solana build tools output to `stderr` regardless of the compilation status
    stderr: String,
    /// UUID of the program, `None` if the [`BuildRequest`] includes `uuid`
    uuid: Option<String>,
    /// Anchor IDL of the program, `None` for native programs
    idl: Option<Idl>,
}

/// Build state
#[derive(Clone)]
pub struct BuildState {
    /// Semaphore to limit concurrent requests
    sem: Arc<Semaphore>,
    /// A set of current requests based on availability (capped by `sem`)
    ids: Arc<Mutex<Vec<bool>>>,
}

impl BuildState {
    /// Create a new value with the maximum amount of concurrent builds.
    pub fn new(concurrency: usize) -> Self {
        Self {
            sem: Arc::new(Semaphore::new(concurrency)),
            ids: Arc::new(Mutex::new(vec![false; concurrency])),
        }
    }
}

/// Build the program.
pub async fn build(
    State(state): State<BuildState>,
    Json(payload): Json<BuildRequest>,
) -> Result<impl IntoResponse> {
    // Only permit a certain number of builds concurrently
    // TODO: Share with others
    let permit = concurrent::Permit::acquire(state).await?;
    let _id = permit.id();

    let (uuid, respond_with_uuid) = match payload.uuid {
        Some(uuid) => Uuid::try_parse(&uuid)
            .map(|_| (uuid, false))
            .map_err(|_| anyhow!("Invalid UUID"))?,
        None => (Uuid::new_v4().to_string(), true),
    };

    let container_out_path = get_out_path();
    let host_out_path = container_out_path.join(&uuid);
    fs::create_dir_all(&host_out_path)
        .await
        .map_err(|e| anyhow!("Failed to create host dir: {host_out_path:?}: {e}"))?;

    let files_path = host_out_path.join(BUILD_FILES);
    fs::write(
        files_path,
        serde_json::to_string(&payload.files).map_err(|e| anyhow!("Invalid build files: {e}"))?,
    )
    .await
    .map_err(|e| anyhow!("Failed to write build files: {e}"))?;

    let programs_path = Path::new(PROGRAMS_DIR);
    let output = Sandbox::new()
        .image("solpg-server-sandbox-program")
        .user("solpg")
        // TODO: Set limits from config
        .cpu_limit(1)
        .memory_limit(2 * 1024 * 1024 * 1024) // 2 GiB
        .process_limit(64)
        .timeout(30)
        .copy(
            format!("{}/.", host_out_path.display()),
            format!("container:{}", programs_path.display()),
        )
        .command(
            Command::new("build-program")
                .arg(programs_path.join(BUILD_FILES))
                .arg(
                    serde_json::to_string(&payload.flags.unwrap_or_default())
                        .map_err(|e| anyhow!("Failed to convert build flags to string: {e}"))?,
                ),
        )
        .copy(
            format!("container:{}/.", container_out_path.display()),
            &host_out_path,
        )
        .run()
        .await?;

    if !output.status.success() {
        return Err(anyhow!(
            "Failed to build: {}",
            str::from_utf8(&output.stderr).map_err(|e| anyhow!("Invalid build output: {e}"))?
        ))?;
    }

    // Check output length
    if output.stderr.len() > MAX_STDERR_LEN {
        return Err(anyhow!(
            "Exceeded maximum build output length: {} > {MAX_STDERR_LEN}",
            output.stderr.len()
        ))?;
    }

    let stderr = String::from_utf8(output.stderr)
        .map_err(|e| anyhow!("Failed to convert stderr output to UTF-8: {e}"))?;

    let idl = match fs::read(host_out_path.join(IDL_FILE)).await {
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

/// Concurrency helpers
mod concurrent {
    use tokio::sync::OwnedSemaphorePermit;

    use super::*;
    use crate::log::error;

    /// A utility type to manage concurrent permits.
    pub(super) struct Permit {
        /// Permit id
        id: usize,
        /// An owned semaphore permit used to limit concurrent requests
        #[allow(unused)]
        permit: OwnedSemaphorePermit,
        /// Build state
        state: BuildState,
    }

    impl Permit {
        /// Acquire a permit.
        ///
        /// # Note
        ///
        /// This function takes ownership of [`BuildState`], even though it doesn't need to, in
        /// order to help make sure the ids [`Mutex`] doesn't get used anywhere else. This is done
        /// to limit the usage of `state.ids` and make sure it never gets poisoned.
        pub async fn acquire(state: BuildState) -> Result<Self> {
            let permit = state
                .sem
                .clone()
                .acquire_owned()
                .await
                .map_err(|e| anyhow!("Failed to acquire `Semaphore`: {e}"))?;

            let mut ids = state
                .ids
                .lock()
                .map_err(|e| anyhow!("Failed to lock ids: {e}"))?;
            let id = ids
                .iter()
                .enumerate()
                .find_map(|(id, used)| (!used).then_some(id))
                .ok_or_else(|| anyhow!("Failed to find concurrency id"))?;
            ids[id] = true;
            drop(ids);

            Ok(Self { id, permit, state })
        }

        /// Get the permit ID.
        pub fn id(&self) -> usize {
            self.id
        }
    }

    impl Drop for Permit {
        fn drop(&mut self) {
            let Ok(mut ids) = self.state.ids.lock() else {
                // TODO: Figure out whether this could happen. It shouldn't happen, but if it does,
                // should we ignore poisoned locks?
                error!("Failed to lock ids for id {}", self.id);
                return;
            };

            ids[self.id] = false;
        }
    }
}
