use std::{
    fs,
    path::Path,
    process::{Command, ExitStatus},
};

use anyhow::Result;

use super::Template;

macro_rules! get_anchor_installation_command {
    ($ver:literal) => {
        // `avm` bug: tries to install unspecified `cargo-build-sbf` when invoking `anchor`.
        // Override the proxy binary with the actual `anchor` CLI to avoid automatic resolution.
        concat!(
            "cargo install --git https://github.com/otter-sec/anchor avm --force && ",
            "avm install ",
            $ver,
            " && ",
            "mv ~/.avm/bin/anchor-",
            $ver,
            " ~/.cargo/bin/anchor"
        )
    };
}
pub(super) use get_anchor_installation_command;

const PROGRAM_DIR: &str = "programs/program";
const BINARY_DIR: &str = "target/deploy";
const IDL_DIR: &str = "target/idl";

pub struct Anchor0_29_0;

impl Anchor0_29_0 {
    pub fn template() -> Template {
        Template {
            name: "anchor-0.29.0",
            rust_version: "1.68.0",
            solana_version: Some("1.17.25"),
            cargo_build_sbf_version: None,
            installation_command: Some(get_anchor_installation_command!("0.29.0")),
            initial_build_command: "anchor build -- -- --locked",
            program_dir: Path::new(PROGRAM_DIR),
            binary_dir: Path::new(BINARY_DIR),
            idl_dir: Some(Path::new(IDL_DIR)),
            build,
        }
    }
}

pub struct Anchor1_2_1;

impl Anchor1_2_1 {
    pub fn template() -> Template {
        Template {
            name: "anchor-1.2.1",
            rust_version: "1.89.0",
            solana_version: None,
            cargo_build_sbf_version: Some("4.4.0"),
            installation_command: Some(get_anchor_installation_command!("1.2.1")),
            initial_build_command:
                "anchor build --no-idl -- -- --locked && anchor idl build -- --locked",
            program_dir: Path::new(PROGRAM_DIR),
            binary_dir: Path::new(BINARY_DIR),
            idl_dir: Some(Path::new(IDL_DIR)),
            build,
        }
    }
}

fn build(args: &[String]) -> Result<ExitStatus> {
    // Disable auto `keys sync` on the first build:
    // https://github.com/otter-sec/anchor/blob/2e78e39d20fab02bc0529cbffab765eddafdfc43/cli/src/config.rs#L706-L711
    fs::create_dir_all(BINARY_DIR)?;

    let mut cmd = Command::new("anchor");
    cmd.arg("build");

    let has_ignore_keys = Command::new("anchor")
        .arg("build")
        .arg("--help")
        .output()
        .map(|output| output.stdout)
        .map(String::from_utf8)??
        .contains("--ignore-keys");
    if has_ignore_keys {
        cmd.arg("--ignore-keys");
    }

    cmd.args(args).status().map_err(Into::into)
}
