use tracing_subscriber::EnvFilter;

/// Initialize logging in the application.
///
/// Log levels via environment variables are supported similar to [`env-logger`].
///
/// [`env-logger`]: https://github.com/rust-cli/env_logger
pub fn init_logging(verbose: bool) {
    let fmt = tracing_subscriber::fmt()
        .with_target(false)
        .with_env_filter(EnvFilter::from_default_env());

    if verbose {
        fmt.pretty().init();
    } else {
        fmt.compact().init();
    }
}
