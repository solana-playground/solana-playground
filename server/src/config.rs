use std::str::FromStr;

use dotenv::dotenv;

/// Server configuration
#[derive(Debug)]
pub struct Config {
    /// Client URL to allow requests from
    pub client_url: String,
    /// Port to listen from
    pub port: u16,
    /// Request payload size limit in bytes
    pub payload_limit: usize,
    /// Whether logs should be verbose
    pub verbose: bool,
    /// Database URI
    pub db_uri: String,
    /// Database name
    pub db_name: String,
}

impl Config {
    /// Create [`Config`] from the environment variables.
    ///
    /// `.env` file is supported.
    pub fn from_env() -> Config {
        dotenv().ok();
        Config {
            client_url: get_env("CLIENT_URL", "https://beta.solpg.io"),
            port: get_env("PORT", 8080u16),
            payload_limit: get_env("PAYLOAD_LIMIT", 1024usize * 1024 * 1024),
            verbose: get_env("VERBOSE", false),
            db_uri: get_env("DB_URI", "mongodb://localhost:27017"),
            db_name: get_env("DB_NAME", "solpg"),
        }
    }
}

/// Get the environment variable value or return the `default`.
///
/// All environment variables are prefixed with `PG_` in order to prevent clashes.
fn get_env<T: FromStr>(key: &str, default: impl Into<T>) -> T {
    dotenv::var(format!("PG_{key}"))
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(default.into())
}
