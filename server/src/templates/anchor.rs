use std::{
    path::Path,
    process::{Command, ExitStatus},
};

use anyhow::Result;

use super::{Process, Template};

pub struct Anchor0_29_0;

impl Anchor0_29_0 {
    pub fn template() -> Template {
        Template {
            name: "anchor-0.29.0",
            solana_version: "1.17.25",
            rust_version: "1.68.0",
            // `avm` bug: tries to install unspecified `cargo-build-sbf` when invoking `anchor`.
            // Override the proxy binary with the actual `anchor` CLI to avoid automatic resolution.
            installation_command: Some(
                "cargo install --git https://github.com/solana-foundation/anchor avm --force && \
                avm install 0.29.0 && \
                mv ~/.avm/bin/anchor-0.29.0 ~/.cargo/bin/anchor",
            ),
            initial_build_command: "anchor build -- -- --locked",
            program_path: Path::new("programs/program"),
            binary_path: Path::new("target/deploy"),
            idl_path: Some(Path::new("target/idl")),
            processor: Box::new(Self),
        }
    }
}

impl Process for Anchor0_29_0 {
    fn build(&self, args: &[String]) -> Result<ExitStatus> {
        Command::new("anchor")
            .arg("build")
            .args(args)
            .arg("--")
            .arg("--offline")
            .status()
            .map_err(Into::into)
    }
}

pub struct Anchor1_1_2;

impl Anchor1_1_2 {
    pub fn template() -> Template {
        Template {
            name: "anchor-1.1.2",
            solana_version: "3.1.10",
            rust_version: "1.89.0",
            // `avm` bug: tries to install unspecified `cargo-build-sbf` when invoking `anchor`.
            // Override the proxy binary with the actual `anchor` CLI to avoid automatic resolution.
            installation_command: Some(
                "cargo install --git https://github.com/solana-foundation/anchor avm --force && \
                avm install 1.1.2 && \
                mv ~/.avm/bin/anchor-1.1.2 ~/.cargo/bin/anchor",
            ),
            initial_build_command: "anchor build",
            program_path: Path::new("programs/program"),
            binary_path: Path::new("target/deploy"),
            idl_path: Some(Path::new("target/idl")),
            processor: Box::new(Self),
        }
    }
}

impl Process for Anchor1_1_2 {
    fn build(&self, args: &[String]) -> Result<ExitStatus> {
        Command::new("anchor")
            .arg("build")
            .args(args)
            .status()
            .map_err(Into::into)
    }
}
