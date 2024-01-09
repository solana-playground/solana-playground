use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};
use tracing::error;

/// Application result type that can be used in API handler functions
pub type Result<T> = core::result::Result<T, Error>;

/// Application error type that can be returned from [`Result`] in API handler functions.
#[derive(thiserror::Error, Debug)]
pub enum Error {
    /// Catch-all for all remaining errors
    #[error(transparent)]
    Other(#[from] anyhow::Error),
}

impl Error {
    /// Map the error type to the corresponding HTTP status codes.
    fn status_code(&self) -> StatusCode {
        StatusCode::INTERNAL_SERVER_ERROR
    }
}

/// Support converting the errors to an [`axum`] response.
impl IntoResponse for Error {
    fn into_response(self) -> Response {
        // Log the error
        match &self {
            Error::Other(e) => error!("Other error: {e}"),
        }

        (self.status_code(), self.to_string()).into_response()
    }
}
