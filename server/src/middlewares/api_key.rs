use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
};

use crate::config::ApiKey;

/// Gate requests behind a static `X-API-Key` header match.
///
/// When no keys are configured (via axum [`State`]), the middleware is
/// transparent — this matches the current open behavior and lets the server
/// run unchanged in dev environments.
///
/// When one or more keys are configured, a request is only passed through if
/// its `X-API-Key` header matches any of the accepted values under
/// constant-time comparison (delegated to [`ApiKey::matches`]).
/// Otherwise the middleware short-circuits with `401 Unauthorized`.
pub async fn api_key(
    State(keys): State<Vec<ApiKey>>,
    req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    if keys.is_empty() {
        return Ok(next.run(req).await);
    }

    let presented = req
        .headers()
        .get("x-api-key")
        .and_then(|v| v.to_str().ok())
        .unwrap_or_default();

    if keys.iter().any(|k| k.matches(presented.as_bytes())) {
        Ok(next.run(req).await)
    } else {
        Err(StatusCode::UNAUTHORIZED)
    }
}
