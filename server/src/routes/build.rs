use anchor_syn::idl::types::Idl;
use anyhow::anyhow;
use axum::{extract::Json, response::IntoResponse};
use serde::{Deserialize, Serialize};
use tokio::task;
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

/// Build the program.
pub async fn build(Json(payload): Json<BuildRequest>) -> Result<impl IntoResponse> {
    let (uuid, respond_with_uuid) = match payload.uuid {
        Some(uuid) => Uuid::try_parse(&uuid)
            .map(|_| (uuid, false))
            .map_err(|_| anyhow!("Invalid UUID"))?,
        None => (Uuid::new_v4().to_string(), true),
    };

    // Spawn a blocking `tokio::task` to avoid blocking the thread
    let (build_result, uuid) =
        task::spawn_blocking(move || (program::build(&uuid, &payload.files), uuid))
            .await
            .expect("`spawn_blocking` failure");
    let (stderr, idl) = build_result?;

    Ok(Json(BuildResponse {
        stderr,
        uuid: if respond_with_uuid { Some(uuid) } else { None },
        idl,
    }))
}
