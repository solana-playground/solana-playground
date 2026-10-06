use tracing_subscriber::EnvFilter;

// https://github.com/rust-lang/rustfmt/issues/4070
#[rustfmt::skip]
pub use tracing::*;

/// Initialize logging in the application.
///
/// Log levels via environment variables are supported similar to [`env-logger`].
///
/// [`env-logger`]: https://github.com/rust-cli/env_logger
pub fn init(verbose: bool) {
    let fmt = tracing_subscriber::fmt()
        .with_target(false)
        .with_env_filter(EnvFilter::from_default_env());

    if verbose {
        fmt.pretty().init();
    } else {
        fmt.compact().init();
    }
}

/// Check whether the [`Level::DEBUG`] event or span is enabled.
///
/// This is useful to have when the data to log using [`debug!`] does not exist.
macro_rules! enabled_debug {
    () => {
        $crate::log::enabled!($crate::log::Level::DEBUG)
    };
}

pub(crate) use enabled_debug;
