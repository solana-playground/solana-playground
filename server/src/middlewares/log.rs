use axum::{extract::Request, middleware::Next, response::IntoResponse};
use tracing::{error, info};

/// Create a logging middleware.
///
/// [`TraceLayer`] is intentionally avoided because customization experience is awful.
///
/// [`TraceLayer`]: https://docs.rs/tower-http/0.5.0/tower_http/trace/struct.TraceLayer.html
pub async fn log(req: Request, next: Next) -> impl IntoResponse {
    let uri = req.uri().to_owned();
    let method = req.method().to_owned();
    let headers = req.headers().to_owned();

    let resp = next.run(req).await;
    let status_code = resp.status().as_u16();
    match status_code {
        // Payload Too Large
        413 => {
            let content_len = headers
                .get("content-length")
                .and_then(|len| len.to_str().ok());
            if let Some(len) = content_len {
                error!("{method} {uri} {status_code} ({len})");
            } else {
                error!("{method} {uri} {status_code} (No content-length)");
            }
        }
        // Other errors
        400..=599 => error!("{method} {uri} {status_code}"),
        _ => info!("{method} {uri} {status_code}"),
    }

    resp
}
