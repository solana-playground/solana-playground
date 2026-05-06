use std::sync::Arc;

use anchor_syn::idl::types::Idl;
use anyhow::anyhow;
use axum::{
    extract::{Json, State},
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use tokio::{
    sync::{Mutex, Semaphore, SemaphorePermit},
    task,
};
use uuid::Uuid;

use crate::{
    error::Result,
    program::{self, Files},
};

/// Build request
#[derive(Deserialize)]
pub struct BuildRequest {
    /// Program files to build
    files: Files,
    /// UUID of the program.
    ///
    /// In the first ever request from a client, this will not exist and [`BuildResponse`] will
    /// return a `uuid`. Client is responsible for saving the `uuid` and using it with every
    /// subseqent requests in order to save resources not re-creating the project.
    uuid: Option<String>,
    /// Build flags
    flags: Option<BuildFlags>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct BuildFlags {
    /// Enable Anchor `seeds` feature, defaults to `false`
    seeds_feature: Option<bool>,
    /// Remove doc comments from the IDL, defaults to `true`
    no_docs: Option<bool>,
    /// Enable safety checks, defaults to `false`
    safety_checks: Option<bool>,
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

    /// Acquire a permit and claim a free slot. The permit must be held until the slot is released.
    async fn reserve(&self) -> Result<(usize, SemaphorePermit<'_>)> {
        let permit = self
            .sem
            .acquire()
            .await
            .map_err(|e| anyhow!("Failed to acquire `Semaphore`: {e}"))?;
        let mut ids = self.ids.lock().await;
        let id = ids
            .iter()
            .position(|used| !used)
            .ok_or_else(|| anyhow!("Failed to find concurrency id"))?;
        ids[id] = true;
        Ok((id, permit))
    }

    async fn release(&self, id: usize) {
        self.ids.lock().await[id] = false;
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

    // Only permit a certain number of builds concurrently
    let (concurrency_id, permit) = state.reserve().await?;

    // Spawn a blocking `tokio::task` to avoid blocking the thread
    let (build_result, uuid) = task::spawn_blocking(move || {
        let flags = payload.flags.as_ref();
        (
            program::build(
                concurrency_id,
                &uuid,
                &payload.files,
                flags.and_then(|f| f.seeds_feature).unwrap_or_default(),
                flags.and_then(|f| f.no_docs).unwrap_or(true),
                flags.and_then(|f| f.safety_checks).unwrap_or_default(),
            ),
            uuid,
        )
    })
    .await
    .expect("`spawn_blocking` failure");

    state.release(concurrency_id).await;
    drop(permit);
    let (stderr, idl) = build_result?;

    Ok(Json(BuildResponse {
        stderr,
        uuid: if respond_with_uuid { Some(uuid) } else { None },
        idl,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[tokio::test]
    async fn slot_leaks_when_holder_panics() {
        let state = BuildState::new(2);

        let result = tokio::spawn({
            let state = state.clone();
            async move {
                let (_id, _permit) = state.reserve().await.unwrap();
                panic!("simulated build panic");
            }
        })
        .await;

        assert!(result.is_err(), "task should have panicked");

        let ids = state.ids.lock().await;
        assert!(
            ids[0],
            "current implementation leaks the slot when the holder panics"
        );
    }

    #[tokio::test]
    async fn slot_leaks_when_holder_is_cancelled() {
        let state = BuildState::new(2);

        let handle = tokio::spawn({
            let state = state.clone();
            async move {
                let (id, _permit) = state.reserve().await.unwrap();
                tokio::time::sleep(Duration::from_secs(1)).await;
                state.release(id).await;
            }
        });

        tokio::time::sleep(Duration::from_millis(50)).await;
        handle.abort();
        let _ = handle.await;

        let ids = state.ids.lock().await;
        assert!(
            ids[0],
            "current implementation leaks the slot when the holder is cancelled"
        );
    }
}
