use std::{
    fs,
    process::{Command, ExitStatus},
};

use anyhow::Result;

use super::Template;

macro_rules! anchor_installation_command {
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
pub(super) use anchor_installation_command;

const INITIAL_BUILD_COMMAND: &str =
    "anchor build --no-idl -- -- --locked && anchor idl build -- --locked";
const PROGRAM_DIR: &str = "programs/program";
const BINARY_DIR: &str = "target/deploy";
const IDL_DIR: &str = "target/idl";

pub const fn anchor_0_29_0() -> Template {
    Template {
        name: "anchor-0.29.0",
        rust_version: "1.68.0",
        solana_version: Some("1.17.25"),
        cargo_build_sbf_version: None,
        installation_command: Some(anchor_installation_command!("0.29.0")),
        initial_build_command: "anchor build -- -- --locked",
        program_dir: PROGRAM_DIR,
        binary_dir: BINARY_DIR,
        idl_dir: Some(IDL_DIR),
        build,
    }
}

pub const fn anchor_0_30_1() -> Template {
    // This version requires specific `nightly` version to build IDL (recent ones do not work)
    fn build(args: &[String]) -> Result<ExitStatus> {
        // Disable auto `keys sync` on the first build:
        // https://github.com/otter-sec/anchor/blob/v0.30.1/cli/src/config.rs#L518-L523
        fs::create_dir_all(BINARY_DIR)?;
        Command::new("anchor")
            .arg("build")
            .args(args)
            .env("RUSTUP_TOOLCHAIN", "nightly-2024-06-20")
            .status()
            .map_err(Into::into)
    }

    Template {
        name: "anchor-0.30.1",
        rust_version: "1.75.0",
        solana_version: Some("1.18.17"),
        cargo_build_sbf_version: None,
        installation_command: Some(anchor_installation_command!("0.30.1")),
        initial_build_command: "RUSTUP_TOOLCHAIN=nightly-2024-06-20 anchor build -- -- --locked",
        program_dir: PROGRAM_DIR,
        binary_dir: BINARY_DIR,
        idl_dir: Some(IDL_DIR),
        build,
    }
}

pub const fn anchor_0_31_1() -> Template {
    Template {
        name: "anchor-0.31.1",
        rust_version: "1.79.0",
        solana_version: Some("2.1.0"),
        cargo_build_sbf_version: None,
        installation_command: Some(anchor_installation_command!("0.31.1")),
        initial_build_command: INITIAL_BUILD_COMMAND,
        program_dir: PROGRAM_DIR,
        binary_dir: BINARY_DIR,
        idl_dir: Some(IDL_DIR),
        build,
    }
}

pub const fn anchor_0_32_2() -> Template {
    Template {
        name: "anchor-0.32.2",
        rust_version: "1.79.0",
        solana_version: Some("2.3.0"),
        cargo_build_sbf_version: None,
        installation_command: Some(anchor_installation_command!("0.32.2")),
        initial_build_command: INITIAL_BUILD_COMMAND,
        program_dir: PROGRAM_DIR,
        binary_dir: BINARY_DIR,
        idl_dir: Some(IDL_DIR),
        build,
    }
}

pub const fn anchor_1_2_1() -> Template {
    Template {
        name: "anchor-1.2.1",
        rust_version: "1.89.0",
        solana_version: None,
        cargo_build_sbf_version: Some("4.4.0"),
        installation_command: Some(anchor_installation_command!("1.2.1")),
        initial_build_command: INITIAL_BUILD_COMMAND,
        program_dir: PROGRAM_DIR,
        binary_dir: BINARY_DIR,
        idl_dir: Some(IDL_DIR),
        build,
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
