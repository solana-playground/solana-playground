use anyhow::anyhow;
use axum::{extract::Path, response::IntoResponse};
use solpg_server::{
    program::{get_out_path, BINARY_FILE},
    Result,
};
use tokio::{fs, io};

/// Get the program binary.
///
/// Program deployments are not done in the server, the server is only responsible for sending the
/// program binary to the client.
pub async fn deploy(Path(uuid): Path<String>) -> Result<impl IntoResponse> {
    let binary_path = get_out_path(&uuid).join(BINARY_FILE);
    fs::read(binary_path)
        .await
        .map_err(|e| match e.kind() {
            io::ErrorKind::NotFound => anyhow!("Program is not built"),
            _ => e.into(),
        })
        .map_err(Into::into)
}
