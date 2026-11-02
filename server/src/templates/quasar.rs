use std::process::{Command, ExitStatus};

use anyhow::Result;

use super::Template;

pub const fn quasar_0_2_0() -> Template {
    Template {
        name: "quasar-0.2.0-git.863ee777a4520dba165f15bb1037bed1f2f739b8",
        rust_version: "1.95.0",
        solana_version: None,
        cargo_build_sbf_version: Some("4.4.0"),
        installation_command: Some(
            "cargo install quasar-cli \
                --git https://github.com/blueshift-gg/quasar \
                --rev 863ee777a4520dba165f15bb1037bed1f2f739b8",
        ),
        initial_build_command: "quasar build",
        program_dir: ".",
        binary_dir: "target/deploy",
        idl_dir: Some("target/idl"),
        build,
    }
}

fn build(args: &[String]) -> Result<ExitStatus> {
    Command::new("quasar")
        .arg("build")
        .args(args)
        .status()
        .map_err(Into::into)
}
