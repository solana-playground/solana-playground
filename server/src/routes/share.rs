use anyhow::anyhow;
use axum::{extract::Path, response::IntoResponse, Json};
use serde::Deserialize;
use serde_json::Value;

use crate::{db, error::Result};

/// Collection name of shares in database
const COLLECTION: &str = "share";

/// Get the share from its id.
pub async fn share_get(Path(id): Path<String>) -> Result<impl IntoResponse> {
    db::find_by_id(&id, COLLECTION)
        .await?
        .map(Json)
        .ok_or_else(|| anyhow!("Share not found"))
        .map_err(Into::into)
}

/// Share new request
#[derive(Deserialize)]
pub struct ShareNewRequest {
    /// Explorer contains all file related data about the share
    explorer: Value,
}

/// Create a new share.
pub async fn share_new(Json(payload): Json<ShareNewRequest>) -> Result<impl IntoResponse> {
    db::insert(payload.explorer, COLLECTION)
        .await
        .map_err(Into::into)
}
