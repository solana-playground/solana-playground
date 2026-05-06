use std::sync::Arc;

use anchor_syn::idl::types::Idl;
use anyhow::anyhow;
use axum::{
    extract::{Json, State},
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use tokio::{
    sync::{Mutex, Semaphore},
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
    let permit = state
        .sem
        .acquire()
        .await
        .map_err(|e| anyhow!("Failed to acquire `Semaphore`: {e}"))?;
    let mut ids = state.ids.lock().await;
    let concurrency_id = ids
        .iter()
        .enumerate()
        .find_map(|(id, used)| (!used).then_some(id))
        .ok_or_else(|| anyhow!("Failed to find concurrency id"))?;
    ids[concurrency_id] = true;
    drop(ids);

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

    let mut ids = state.ids.lock().await;
    ids[concurrency_id] = false;
    drop(ids);
    drop(permit);
    let (stderr, idl) = build_result?;

    Ok(Json(BuildResponse {
        stderr,
        uuid: if respond_with_uuid { Some(uuid) } else { None },
        idl,
    }))
}
