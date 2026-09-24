use std::time::Duration;

use axum::http::{header, Method};
use tower_http::cors::{AllowOrigin, CorsLayer};

use crate::log::error;

/// Whether requests from `origin` are allowed.
///
/// Prefix matching, because `client_urls` entries like `https://solana-playground-`
/// stand for every Vercel preview deployment.
pub fn is_allowed_origin(origin: &[u8], client_urls: &[String]) -> bool {
    client_urls
        .iter()
        .any(|url| origin.starts_with(url.as_bytes()))
}

/// Create a CORS middleware.
///
/// Request origins other than `client_urls` are not allowed.
pub fn cors(client_urls: Vec<String>) -> CorsLayer {
    CorsLayer::new()
        .allow_origin(AllowOrigin::predicate(move |origin, _| {
            let allowed = is_allowed_origin(origin.as_bytes(), &client_urls);

            // Logging middleware doesn't catch CORS errors, log the error here instead
            if !allowed {
                match origin.to_str() {
                    Ok(origin) => error!("CORS blocked from origin {origin}"),
                    Err(e) => error!("CORS blocked from invalid origin: {e} ({origin:?})"),
                }
            }

            allowed
        }))
        .allow_methods([Method::GET, Method::POST])
        .allow_headers([header::CONTENT_TYPE])
        .max_age(Duration::from_secs(600))
}
