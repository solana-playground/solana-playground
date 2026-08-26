use std::{env, fs, path::Path, process::Command};

use anchor_syn::idl::parse::file::parse as parse_idl;
use anyhow::{anyhow, Result};
use regex::Regex;
use solpg_server::{
    program::{get_out_path, BuildFlags, IDL_FILE, MAX_FILE_AMOUNT, MAX_PATH_LEN, PROGRAMS_DIR},
    utils::Files,
};

fn main() -> Result<()> {
    let args = Args::from_env()?;
    build(&args)
}

struct Args {
    files: Files,
    flags: BuildFlags,
}

impl Args {
    fn from_env() -> Result<Self> {
        let mut args = env::args();
        if args.next().is_none() {
            return Err(anyhow!("Program not given"));
        };

        let files = args
            .next()
            .ok_or_else(|| anyhow!("Files path not given"))
            .map(fs::read)?
            .map(|bytes| serde_json::from_slice(&bytes))??;
        let flags = args
            .next()
            .ok_or_else(|| anyhow!("Build flags not given"))
            .map(|s| serde_json::from_str(&s))??;

        Ok(Self { files, flags })
    }
}

/// Build the program from the given files.
///
/// Only Rust source files starting with `/src` are allowed to be passed in, an error is returned
/// otherwise.
///
/// NOTE: This function doesn't return an error in the case of a compiler error.
fn build(args: &Args) -> Result<()> {
    let files = &args.files;

    // Check file count
    if files.len() > MAX_FILE_AMOUNT {
        return Err(anyhow!(
            "Exceeded maximum file amount: {} > {MAX_FILE_AMOUNT}",
            files.len()
        ));
    }

    // Check file paths
    let allowed_regex = Regex::new(r"^/src/[\w/-]+\.rs$")?;
    for (path, _) in files {
        let is_valid = path.len() <= MAX_PATH_LEN
            && !path.contains("..")
            && !path.contains("//")
            && allowed_regex.is_match(path);
        if !is_valid {
            return Err(anyhow!("Invalid path: {path}"));
        }
    }

    // Write files
    let programs_path = Path::new(PROGRAMS_DIR);
    let program_path = programs_path.join("default");
    for (path, content) in files {
        let relative_path = path.trim_start_matches('/');
        let path = program_path.join(relative_path);
        let parent_path = path
            .parent()
            .ok_or_else(|| anyhow!("No parent: {path:?}"))?;
        fs::create_dir_all(parent_path)?;
        fs::write(path, content)?;
    }

    // Build the program
    let out_path = get_out_path();
    let status = Command::new("cargo-build-sbf")
        .arg("--offline")
        .arg("--manifest-path")
        .arg(programs_path.join("Cargo.toml"))
        .arg("--sbf-out-dir")
        .arg(&out_path)
        .status()?;
    if !status.success() {
        return Ok(());
    }

    // Generate IDL if it's an Anchor program
    let lib_path = program_path.join("src").join("lib.rs");
    let is_anchor = fs::read_to_string(&lib_path)?.contains("anchor_lang");
    if is_anchor {
        // TODO: Run `anchor idl parse` instead for output consistency
        match parse_idl(
            lib_path,
            "0.1.0".into(),
            args.flags.seeds_feature,
            args.flags.no_docs,
            args.flags.safety_checks,
        ) {
            Ok(idl) => fs::write(out_path.join(IDL_FILE), serde_json::to_string(&idl)?)?,
            Err(e) => eprintln!("IDL error: {e}"),
        };
    }

    Ok(())
}
