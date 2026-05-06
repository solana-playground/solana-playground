use std::sync::{Arc, Mutex};

use anchor_syn::idl::types::Idl;
use anyhow::anyhow;
use axum::{
    extract::{Json, State},
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use tokio::{
    sync::{Semaphore, SemaphorePermit},
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

    /// Acquire a permit and claim a free slot. The slot is released when the returned guard drops.
    async fn reserve(&self) -> Result<SlotGuard<'_>> {
        let permit = self
            .sem
            .acquire()
            .await
            .map_err(|e| anyhow!("Failed to acquire `Semaphore`: {e}"))?;
        let mut ids = self.ids.lock().unwrap_or_else(|e| e.into_inner());
        let id = ids
            .iter()
            .position(|used| !used)
            .ok_or_else(|| anyhow!("Failed to find concurrency id"))?;
        ids[id] = true;
        drop(ids);
        Ok(SlotGuard {
            ids: self.ids.clone(),
            id,
            _permit: permit,
        })
    }
}

/// Releases the slot (and permit) on drop, regardless of how the holder exits.
struct SlotGuard<'a> {
    ids: Arc<Mutex<Vec<bool>>>,
    id: usize,
    _permit: SemaphorePermit<'a>,
}

impl SlotGuard<'_> {
    fn id(&self) -> usize {
        self.id
    }
}

impl Drop for SlotGuard<'_> {
    fn drop(&mut self) {
        let mut ids = self.ids.lock().unwrap_or_else(|e| e.into_inner());
        ids[self.id] = false;
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
    let slot = state.reserve().await?;
    let concurrency_id = slot.id();

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
    .map_err(|e| anyhow!("`spawn_blocking` failure: {e}"))?;

    drop(slot);
    let (stderr, idl) = build_result?;

    Ok(Json(BuildResponse {
        stderr,
        uuid: if respond_with_uuid { Some(uuid) } else { None },
        idl,
    }))
}

#[cfg(test)]
mod tests {
    use std::time::Duration;

    use super::*;

    #[tokio::test]
    async fn slot_freed_on_normal_drop() {
        let state = BuildState::new(2);
        let slot = state.reserve().await.unwrap();
        let id = slot.id();
        drop(slot);
        let ids = state.ids.lock().expect("slot table not poisoned");
        assert!(!ids[id], "slot must be freed on normal drop");
    }

    #[tokio::test]
    async fn slot_freed_when_holder_panics() {
        let state = BuildState::new(2);

        let result = tokio::spawn({
            let state = state.clone();
            async move {
                let _slot = state.reserve().await.unwrap();
                panic!("simulated build panic");
            }
        })
        .await;

        assert!(result.is_err(), "task should have panicked");

        let ids = state.ids.lock().expect("slot table not poisoned");
        assert!(!ids[0], "slot must be freed on panic");
    }

    #[tokio::test]
    async fn slot_freed_when_holder_is_cancelled() {
        let state = BuildState::new(2);

        let handle = tokio::spawn({
            let state = state.clone();
            async move {
                let _slot = state.reserve().await.unwrap();
                tokio::time::sleep(Duration::from_secs(1)).await;
            }
        });

        // Wait until the spawned task actually claims the slot, so the assertion
        // can't pass for the wrong reason on a slow runner.
        let start = std::time::Instant::now();
        loop {
            if state.ids.lock().expect("slot table not poisoned")[0] {
                break;
            }
            assert!(
                start.elapsed() < Duration::from_secs(5),
                "spawned task did not claim a slot within timeout",
            );
            tokio::time::sleep(Duration::from_millis(1)).await;
        }

        handle.abort();
        let _ = handle.await;

        let ids = state.ids.lock().expect("slot table not poisoned");
        assert!(!ids[0], "slot must be freed on cancellation");
    }

    #[tokio::test]
    async fn concurrent_reservations_get_distinct_ids_and_block_when_full() {
        let state = BuildState::new(2);

        let s1 = state.reserve().await.unwrap();
        let s2 = state.reserve().await.unwrap();
        assert_ne!(
            s1.id(),
            s2.id(),
            "concurrent reservations must use distinct ids"
        );

        let blocked = tokio::time::timeout(Duration::from_millis(50), state.reserve()).await;
        assert!(
            blocked.is_err(),
            "third reservation must block when capacity is exhausted"
        );

        let freed_id = s1.id();
        drop(s1);
        let s3 = state.reserve().await.unwrap();
        assert_eq!(s3.id(), freed_id, "released id should be reused");
        assert_ne!(s3.id(), s2.id());
    }
}
