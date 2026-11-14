use std::convert::Infallible;

use axum::{
    body::{to_bytes, Body},
    extract::Request,
    http::StatusCode,
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::Route,
};
use tower::{limit::ConcurrencyLimitLayer, Layer, Service};
use tower_http::limit::RequestBodyLimitLayer;

/// Create a concurrency limit middleware.
pub fn concurrency_limit(limit: usize) -> ConcurrencyLimitLayer {
    ConcurrencyLimitLayer::new(limit)
}

/// Create a request (payload) size limit middleware.
///
/// A response with status code 413 (Content Too Large) is returned for any payload above `limit`.
pub fn request_size_limit(limit: usize) -> RequestBodyLimitLayer {
    RequestBodyLimitLayer::new(limit)
}

// TODO: Simplify the return type
/// Create a response size limit middleware.
///
/// # Note
///
/// The size depends on the existance and the order of the compression middleware. If the
/// compression layer is before this layer, the size will be the compressed size; otherwise, it will
/// be the uncompressed (raw) size.
pub fn response_size_limit(
    limit: usize,
) -> impl Layer<
    Route,
    Service: Service<Request, Response = Response, Error = Infallible, Future: Send + 'static>
                 + Clone
                 + Send
                 + Sync
                 + 'static,
> + Clone
       + Send
       + 'static {
    middleware::from_fn(move |req: Request, next: Next| async move {
        let (parts, body) = next.run(req).await.into_parts();
        match to_bytes(body, limit).await {
            Ok(bytes) => Response::from_parts(parts, Body::from(bytes)),
            Err(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Exceeded the maximum response size",
            )
                .into_response(),
        }
    })
}
