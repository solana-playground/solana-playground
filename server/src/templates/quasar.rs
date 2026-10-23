use std::process::{Command, ExitStatus};

use anyhow::Result;

use super::Template;

/// Branch is `0.2.0-release` but it's versioned as 3 in [`Cargo.toml`].
///
/// [`Cargo.toml`]: https://github.com/blueshift-gg/quasar/blob/b85d5a74832d3ce24ea86869b1cdb06817a734bb/Cargo.toml#L7
pub const fn quasar_0_3_0() -> Template {
    Template {
        name: "quasar-0.3.0-git.b85d5a74832d3ce24ea86869b1cdb06817a734bb",
        rust_version: "1.95.0",
        solana_version: None,
        cargo_build_sbf_version: Some("4.4.0"),
        installation_command: Some(
            "cargo install quasar-cli \
                --git https://github.com/blueshift-gg/quasar \
                --rev b85d5a74832d3ce24ea86869b1cdb06817a734bb",
        ),
        initial_build_command: "quasar build",
        program_dir: ".",
        binary_dir: "target/deploy",
        idl_dir: Some("target/idl"),
        build,
    }
}

fn build(args: &[String]) -> Result<ExitStatus> {
    // TODO: Check whether the following analysis is correct, and if so, fix it upstream.
    //
    // `quasar` (most likely) has a bug in its CLI that results in longer build times and printing:
    //
    // ```
    // warning: could not refresh Cargo.lock; building with existing lockfile
    // ```
    //
    // It tries to refresh when it doesn't need to. Likely culprit:
    //
    // https://github.com/blueshift-gg/quasar/blob/b85d5a74832d3ce24ea86869b1cdb06817a734bb/cli/src/build_lockfile.rs#L37-L45
    //
    // Running `cargo-build-sbf --tools-version v1.56` builds immediately without a problem.
    Command::new("quasar")
        .arg("build")
        .args(args)
        .status()
        .map_err(Into::into)
}
