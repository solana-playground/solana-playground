use std::{
    fs,
    path::Path,
    process::{Command, ExitStatus},
};

use anyhow::Result;

use super::{get_anchor_installation_command, Template};

pub struct Legacy;

impl Legacy {
    pub fn template() -> Template {
        Template {
            name: "legacy",
            rust_version: "1.68.0",
            solana_version: Some("1.17.25"),
            cargo_build_sbf_version: None,
            installation_command: Some(get_anchor_installation_command!("0.29.0")),
            initial_build_command: "cargo-build-sbf -- --locked",
            program_dir: Path::new("programs/program"),
            binary_dir: Path::new("target/deploy"),
            idl_dir: Some(Path::new("target/idl")),
            build,
        }
    }
}

fn build(args: &[String]) -> Result<ExitStatus> {
    let status = Command::new("cargo-build-sbf").args(args).status()?;
    if !status.success() {
        return Ok(status);
    }

    let lib_path = Path::new("programs/program/src/lib.rs");
    let is_anchor = fs::read_to_string(lib_path)?.contains("anchor_lang");
    if !is_anchor {
        return Ok(status);
    }

    let idl_path = Path::new("target/idl");
    fs::create_dir_all(idl_path)?;

    // `anchor_syn::idl::parse::file::parse` was used before, but switching to the command in
    // order to reduce host (server) dependencies
    Command::new("anchor")
        .arg("idl")
        .arg("parse")
        .arg("--file")
        .arg(lib_path)
        .arg("--out")
        .arg(idl_path.join("idl.json"))
        .status()
        .map_err(Into::into)
}
