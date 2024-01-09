use anyhow::anyhow;
use axum::{extract::Path, response::IntoResponse};
use tokio::io;

use crate::{error::Result, program};

/// Get the program binary.
///
/// Program deployments are not done in the server, the server is only responsible for sending the
/// program binary to the client.
pub async fn deploy(Path(uuid): Path<String>) -> Result<impl IntoResponse> {
    program::get_binary(&uuid)
        .await
        .map_err(|e| match e.kind() {
            io::ErrorKind::NotFound => anyhow!("Program is not built"),
            _ => e.into(),
        })
        .map_err(Into::into)
}
