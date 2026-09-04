use std::str::FromStr;

use anyhow::Result;
use dotenv::dotenv;
use solpg_server::SandboxLimits;

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
    /// Unstable build configuration
    pub unstable_build: BuildConfig,
    /// Unstable bundle configuration
    pub unstable_bundle: BundleConfig,
    /// Maximum amount of concurrent language server sessions
    pub lsp_concurrency: usize,
    /// Seconds without a client message before a language server session is closed
    pub lsp_idle_timeout: u64,
    /// Seconds after which a language server session is closed regardless of activity
    pub lsp_max_lifetime: u64,
}

impl Config {
    /// Create [`Config`] from the environment variables.
    ///
    /// `.env` file is supported.
    pub fn from_env() -> Result<Config> {
        dotenv().ok();

        Ok(Config {
            client_urls: get_env::<String>("CLIENT_URLS", "http://localhost,https://beta.solpg.io")
                .split(',')
                .map(str::trim)
                .map(ToOwned::to_owned)
                .collect(),
            port: get_env("PORT", 8080u16),
            payload_limit: get_env("PAYLOAD_LIMIT", 1024usize * 1024),
            verbose: get_env("VERBOSE", false),
            db_uri: get_env("DB_URI", "mongodb://localhost:27017"),
            db_name: get_env("DB_NAME", "solpg"),
            build_concurrency: get_env("BUILD_CONCURRENCY", 16usize),
            unstable_build: BuildConfig {
                limits: Limits {
                    route: RouteLimits {
                        concurrency: get_env("UNSTABLE_BUILD_CONCURRENCY_LIMIT", 16usize),
                    },
                    sandbox: SandboxLimits {
                        cpu: Some(get_env("UNSTABLE_BUILD_CPU_LIMIT", 1usize)),
                        memory: Some(get_env(
                            "UNSTABLE_BUILD_MEMORY_LIMIT",
                            2usize * 1024 * 1024 * 1024, // 2 GiB
                        )),
                        process: Some(get_env("UNSTABLE_BUILD_PROCESS_LIMIT", 64usize)),
                        storage: get_env_raw("UNSTABLE_BUILD_STORAGE_LIMIT")
                            .map(|v| v.parse())
                            .transpose()?,
                        timeout: Some(get_env("UNSTABLE_BUILD_TIMEOUT_LIMIT", 30u64)),
                    },
                },
            },
            unstable_bundle: BundleConfig {
                // TODO: Re-evaulate defaults before stabilization
                limits: Limits {
                    route: RouteLimits {
                        concurrency: get_env("UNSTABLE_BUNDLE_CONCURRENCY_LIMIT", 16usize),
                    },
                    sandbox: SandboxLimits {
                        // Diminishing returns after 4
                        cpu: Some(get_env("UNSTABLE_BUNDLE_CPU_LIMIT", 4usize)),
                        memory: Some(get_env(
                            "UNSTABLE_BUNDLE_MEMORY_LIMIT",
                            4usize * 1024 * 1024 * 1024, // 4 GiB (also affects speed)
                        )),
                        process: Some(get_env("UNSTABLE_BUNDLE_PROCESS_LIMIT", 64usize)),
                        storage: get_env_raw("UNSTABLE_BUNDLE_STORAGE_LIMIT")
                            .map(|v| v.parse())
                            .transpose()?,
                        timeout: Some(get_env("UNSTABLE_BUNDLE_TIMEOUT_LIMIT", 180u64)),
                    },
                },
            },
            lsp_concurrency: get_env("LSP_CONCURRENCY", 4usize),
            lsp_idle_timeout: get_env("LSP_IDLE_TIMEOUT", 600u64),
            lsp_max_lifetime: get_env("LSP_MAX_LIFETIME", 4 * 3600u64),
        })
    }
}

/// Build route configuration
#[derive(Debug)]
pub struct BuildConfig {
    /// Build limits
    pub limits: Limits,
}

/// Bundle route configuration
#[derive(Debug)]
pub struct BundleConfig {
    /// Bundle limits
    pub limits: Limits,
}

/// General limits
#[derive(Debug)]
pub struct Limits {
    /// Route-based limits
    pub route: RouteLimits,
    /// Sandbox-only limits
    pub sandbox: SandboxLimits,
}

/// Route-based limits
#[derive(Debug)]
pub struct RouteLimits {
    // Maximum amount of concurrent requests
    pub concurrency: usize,
}

/// Get and parse the environment variable or return the given `default`.
fn get_env<T: FromStr>(key: &str, default: impl Into<T>) -> T {
    get_env_raw(key)
        .and_then(|s| s.parse().ok())
        .unwrap_or(default.into())
}

/// Get the raw string environment variable.
///
/// All environment variables are prefixed with `PG_` in order to prevent clashes.
fn get_env_raw(key: &str) -> Option<String> {
    dotenv::var(format!("PG_{key}")).ok()
}
