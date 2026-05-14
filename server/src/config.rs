use std::{fmt, str::FromStr};

use dotenv::dotenv;
use sha2::{Digest, Sha256};
use subtle::ConstantTimeEq;

/// Server configuration
#[derive(Debug)]
pub struct Config {
    /// Client URLs to allow requests from
    pub client_urls: Vec<String>,
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
    /// Maximum amount of concurrent builds
    pub build_concurrency: usize,
    /// Shared secrets required in the `X-API-Key` request header. Empty = no gate.
    pub api_keys: Vec<ApiKey>,
}

/// Newtype that keeps the API key out of `Debug` output and off of every
/// other code path. Comparison happens via [`ApiKey::matches`] so the raw
/// bytes never leave the wrapper.
#[derive(Clone)]
pub struct ApiKey(String);

impl ApiKey {
    /// Hash both sides so `ct_eq` does not leak length via timing.
    pub fn matches(&self, presented: &[u8]) -> bool {
        let a = Sha256::digest(presented);
        let b = Sha256::digest(self.0.as_bytes());
        a.ct_eq(&b).into()
    }
}

impl fmt::Debug for ApiKey {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("\"<redacted>\"")
    }
}

impl Config {
    /// Create [`Config`] from the environment variables.
    ///
    /// `.env` file is supported.
    pub fn from_env() -> Config {
        dotenv().ok();
        Config {
            client_urls: get_env::<String>("CLIENT_URLS", "http://localhost,https://beta.solpg.io")
                .split(',')
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .map(ToOwned::to_owned)
                .collect(),
            port: get_env("PORT", 8080u16),
            payload_limit: get_env("PAYLOAD_LIMIT", 1024usize * 1024),
            verbose: get_env("VERBOSE", false),
            db_uri: get_env("DB_URI", "mongodb://localhost:27017"),
            db_name: get_env("DB_NAME", "solpg"),
            build_concurrency: get_env("BUILD_CONCURRENCY", 16usize),
            api_keys: {
                let single: String = get_env("API_KEY", String::new());
                let csv: String = get_env("API_KEYS", String::new());
                let mut keys = Vec::new();
                if !single.is_empty() {
                    keys.push(ApiKey(single));
                }
                keys.extend(
                    csv.split(',')
                        .map(str::trim)
                        .filter(|s| !s.is_empty())
                        .map(|s| ApiKey(s.to_owned())),
                );
                keys
            },
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn api_key_matches_exact() {
        let key = ApiKey("secret".into());
        assert!(key.matches(b"secret"));
    }

    #[test]
    fn api_key_rejects_mismatch() {
        let key = ApiKey("secret".into());
        assert!(!key.matches(b"wrong"));
        assert!(!key.matches(b""));
    }

    #[test]
    fn multiple_keys_accepts_any() {
        let keys = [ApiKey("alpha".into()), ApiKey("beta".into())];
        assert!(keys.iter().any(|k| k.matches(b"alpha")));
        assert!(keys.iter().any(|k| k.matches(b"beta")));
        assert!(!keys.iter().any(|k| k.matches(b"gamma")));
    }
}
