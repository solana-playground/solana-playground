use tower_http::limit::RequestBodyLimitLayer;

/// Create a payload limit middleware.
///
/// A response with status code 413(Payload Too Large) is returned for any payload above `limit`.
pub fn payload_limit(limit: usize) -> RequestBodyLimitLayer {
    RequestBodyLimitLayer::new(limit)
}
