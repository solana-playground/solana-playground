use std::time::Duration;

use http::{header, Method};
use tower_http::cors::{AllowOrigin, CorsLayer};
use tracing::error;

/// Create a CORS middleware.
///
/// Request origins other than `client_url` and `localhost` are not allowed.
pub fn cors(client_url: String) -> CorsLayer {
    CorsLayer::new()
        .allow_origin(AllowOrigin::predicate(move |origin, _| {
            let origin_bytes = origin.as_bytes();
            if origin_bytes == client_url.as_bytes()
                || origin_bytes.starts_with(b"http://localhost")
            {
                return true;
            }

            // Logging middleware doesn't catch CORS errors, log the error here instead
            if let Ok(origin) = origin.to_str() {
                error!("CORS blocked from origin {origin}");
            }

            false
        }))
        .allow_methods([Method::GET, Method::POST])
        .allow_headers([header::CONTENT_TYPE])
        .max_age(Duration::from_secs(600))
}
