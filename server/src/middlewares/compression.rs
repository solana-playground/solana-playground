use tower_http::compression::CompressionLayer;

/// Create a compression middleware.
///
/// The compression algorithm used will be based on the request headers.
pub fn compression() -> CompressionLayer {
    CompressionLayer::new()
}
