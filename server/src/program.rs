use std::{fs, io, path::Path, process::Command, sync::LazyLock};

use anchor_syn::idl::{parse::file::parse as parse_idl, types::Idl};
use anyhow::anyhow;
use regex::Regex;

use crate::log::{info, warn};

/// Directory name of where the programs are stored
const PROGRAMS_DIR: &str = "programs";

/// Maximum amount of files to pass to the [`build`] function
const MAX_FILE_AMOUNT: usize = 64;

/// Maximum length of the file paths to pass to the [`build`] function
const MAX_PATH_LEN: usize = 128;

/// Max program build output stderr length
const MAX_STDERR_LEN: usize = 1024 * 1024 * 1024;

/// A vector of [Path, Content]
pub type Files = Vec<[String; 2]>;

/// Build the program from the given program name and files.
///
/// `program_name` is only being used as the directory name of the program and it doesn't have an
/// effect on the name in `Cargo.toml`.
///
/// Only Rust source files starting with `/src` are allowed to be passed in, an error is returned
/// otherwise.
///
/// NOTE: This function doesn't return an error in the case of a compiler error.
pub fn build(
    concurrency_id: usize,
    program_name: &str,
    files: &Files,
    seeds_feature: bool,
    no_docs: bool,
    safety_checks: bool,
) -> anyhow::Result<(String, Option<Idl>)> {
    // Check file count
    if files.len() > MAX_FILE_AMOUNT {
        return Err(anyhow!(
            "Exceeded maximum file amount: {} > {MAX_FILE_AMOUNT}",
            files.len()
        ));
    }

    // Check file paths
    static ALLOWED_REGEX: LazyLock<Regex> =
        LazyLock::new(|| Regex::new(r"^/src/[\w/-]+\.rs$").unwrap());
    for [path, _] in files {
        let is_valid = path.len() <= MAX_PATH_LEN
            && !path.contains("..")
            && !path.contains("//")
            && ALLOWED_REGEX.is_match(path);
        if !is_valid {
            return Err(anyhow!("Invalid path: {path}"));
        }
    }

    // Copy `Cargo.*` files into a separate directory (only once)
    let concurrency_path = Path::new(PROGRAMS_DIR).join(concurrency_id.to_string());
    let concurrency_ready_path = concurrency_path.join("ready");
    if !fs::exists(&concurrency_ready_path)? {
        info!("Initializing concurrency id {concurrency_id}");
        fs::create_dir_all(&concurrency_path)?;
        fs::copy(
            Path::new(PROGRAMS_DIR).join("Cargo.toml"),
            concurrency_path.join("Cargo.toml"),
        )?;
        fs::copy(
            Path::new(PROGRAMS_DIR).join("Cargo.lock"),
            concurrency_path.join("Cargo.lock"),
        )?;
        fs::write(concurrency_ready_path, [])?;
        info!("Initialized concurrency id {concurrency_id}");
    }

    // Remove existing files
    //
    // TODO: Compare with existing files and only remove the unused ones instead of removing all
    let program_path = Path::new(PROGRAMS_DIR).join(program_name);
    if let Err(e) = fs::remove_dir_all(program_path.join("src")) {
        if e.kind() != io::ErrorKind::NotFound {
            return Err(anyhow!("Failed to remove existing files: {e}"));
        }
    };

    // Write files
    for [path, content] in files {
        let relative_path = path.trim_start_matches('/');
        let item_path = program_path.join(relative_path);

        // Create directories when necessary
        let parent_path = item_path.parent().expect("Must have parent");
        fs::create_dir_all(parent_path)?;

        // Write file
        fs::write(item_path, content)?;
    }

    // Update manifest
    static MANIFEST: LazyLock<String> = LazyLock::new(|| {
        fs::read_to_string(Path::new(PROGRAMS_DIR).join("Cargo.toml"))
            .expect("Could not read manifest")
    });
    let manifest_path = concurrency_path.join("Cargo.toml");
    fs::write(
        &manifest_path,
        MANIFEST.replacen("default", &format!("../{program_name}"), 1),
    )?;

    // Build the program with a clean env, inheriting only toolchain locator vars from the parent.
    let output = Command::new("cargo-build-sbf")
        .env_clear()
        .envs(["PATH", "HOME"].into_iter().filter_map(|key| {
            std::env::var(key)
                .inspect_err(|e| warn!("Failed to get env variable: `{key}`: {e}"))
                .ok()
                .map(|value| (key, value))
        }))
        .arg("--manifest-path")
        .arg(manifest_path)
        .arg("--sbf-out-dir")
        .arg(&program_path)
        .arg("--offline")
        .output()?;

    // Check output length
    if output.stderr.len() > MAX_STDERR_LEN {
        return Err(anyhow!(
            "Exceeded maximum build output length: {} > {MAX_STDERR_LEN}",
            output.stderr.len()
        ));
    }

    // Check compile errors
    let stderr = String::from_utf8(output.stderr)?;
    if stderr.rfind("error: could not compile").is_some() {
        return Ok((stderr, None));
    }

    // Generate IDL if it's an Anchor program
    let lib_path = program_path.join("src").join("lib.rs");
    let ret = fs::read_to_string(&lib_path)?
        .contains("anchor_lang")
        .then(|| {
            parse_idl(
                lib_path,
                "0.1.0".into(),
                seeds_feature,
                no_docs,
                safety_checks,
            )
        })
        .transpose()
        .map_or_else(|e| (format!("IDL error: {e}"), None), |idl| (stderr, idl));
    Ok(ret)
}

/// Read the program ELF and return its bytes.
///
/// In order for the program binary to exist, the program must be built using the [`build`] function
/// before this command is executed.
pub async fn get_binary(program_name: &str) -> tokio::io::Result<Vec<u8>> {
    let binary_path = Path::new(PROGRAMS_DIR).join(program_name).join("solpg.so");
    tokio::fs::read(binary_path).await
}
