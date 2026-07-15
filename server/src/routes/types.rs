use axum::{extract::Path, response::IntoResponse, Json};
use serde::Serialize;

use crate::{error::Result, package::get_types, utils::Files};

/// Types response
#[derive(Serialize)]
struct TypesResponse {
    /// Type declaration files, see [`Files`]
    files: Files,
    /// List of the type dependencies
    dependencies: Vec<String>,
}

/// Get type TypeScript declaration files and type dependencies.
pub async fn types(Path(name): Path<String>) -> Result<impl IntoResponse> {
    get_types(&name)
        .await
        .map(|(files, dependencies)| TypesResponse {
            files,
            dependencies,
        })
        .map(Json)
        .map_err(Into::into)
}
