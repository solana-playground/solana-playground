use axum::{extract::Path, response::IntoResponse};

use crate::{error::Result, package::get_package};

/// Get the ESM package bundled into a single file (runtime only; no types).
// TODO: Concurrency limit
pub async fn packages(Path(name): Path<String>) -> Result<impl IntoResponse> {
    get_package(&name).await.map_err(Into::into)
}
