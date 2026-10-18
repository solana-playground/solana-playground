use std::process::{Command, ExitStatus};

use anyhow::Result;

use super::Template;

const PROGRAM_DIR: &str = "program";

pub const fn pinocchio_0_11_2() -> Template {
    Template {
        name: "pinocchio-0.11.2",
        rust_version: "1.95.0",
        solana_version: None,
        cargo_build_sbf_version: Some("4.4.0"),
        installation_command: None,
        initial_build_command: "cargo-build-sbf --manifest-path program/Cargo.toml -- --locked",
        program_dir: PROGRAM_DIR,
        binary_dir: "program/target/deploy",
        // TODO: Support `codama`
        idl_dir: None,
        build,
    }
}

fn build(args: &[String]) -> Result<ExitStatus> {
    Command::new("cargo-build-sbf")
        .current_dir(PROGRAM_DIR)
        .args(args)
        .status()
        .map_err(Into::into)
}
