use std::{
    path::Path,
    process::{Command, ExitStatus},
};

use anyhow::Result;

use super::{Process, Template};

#[macro_export]
macro_rules! get_anchor_installation_command {
    ($lit:literal) => {
        // `avm` bug: tries to install unspecified `cargo-build-sbf` when invoking `anchor`.
        // Override the proxy binary with the actual `anchor` CLI to avoid automatic resolution.
        concat!(
            "cargo install --git https://github.com/otter-sec/anchor avm --force && ",
            "avm install ",
            $lit,
            " && ",
            "mv ~/.avm/bin/anchor-",
            $lit,
            " ~/.cargo/bin/anchor"
        )
    };
}

pub struct Anchor1_1_2;

impl Anchor1_1_2 {
    pub fn template() -> Template {
        Template {
            name: "anchor-1.1.2",
            solana_version: "3.1.10",
            rust_version: "1.89.0",
            installation_command: Some(get_anchor_installation_command!("1.1.2")),
            initial_build_command: "anchor build --no-idl -- -- --locked && \
            anchor idl build -- --locked",
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
