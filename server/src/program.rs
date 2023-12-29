use std::{fs, path::Path, process::Command, sync::OnceLock};

use anchor_syn::idl::{parse::file::parse as parse_idl, types::Idl};
use anyhow::anyhow;
use regex::Regex;

/// Directory name of where the programs are stored
const PROGRAMS_DIR: &str = "programs";

/// Maximum amount of files to pass to the [`build`] function.
const MAX_FILE_AMOUNT: usize = 64;

/// Maximum length of the file paths to pass to the [`build`] function.
const MAX_PATH_LENGTH: usize = 128;

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
    program_name: &str,
    files: &Files,
    seeds_feature: bool,
    no_docs: bool,
    safety_checks: bool,
) -> anyhow::Result<(String, Option<Idl>)> {
    // Check file count
    if files.len() > MAX_FILE_AMOUNT {
        return Err(anyhow!("Exceeded maximum file amount({MAX_FILE_AMOUNT})"));
    }

    // Check file paths
    static ALLOWED_REGEX: OnceLock<Regex> = OnceLock::new();
    let allowed_regex = ALLOWED_REGEX.get_or_init(|| Regex::new(r"^/src/[\w/-]+\.rs$").unwrap());
    let is_valid = files.iter().all(|[path, _]| {
        allowed_regex.is_match(path)
            && path.len() <= MAX_PATH_LENGTH
            && !path.contains("..")
            && !path.contains("//")
    });
    if !is_valid {
        return Err(anyhow!("Invalid path"));
    }

    // Write files
    let program_path = Path::new(PROGRAMS_DIR).join(program_name);
    for [path, content] in files {
        // TODO: Send relative path from client and remove this line
        let relative_path = path.trim_start_matches('/');
        let item_path = program_path.join(relative_path);

        // Create directories when necessary
        let parent_path = item_path.parent().expect("Should have parent");
        fs::create_dir_all(parent_path)?;

        // Write file
        fs::write(item_path, content)?;
    }

    // Update manifest path
    static MANIFEST: OnceLock<String> = OnceLock::new();
    let manifest_path = Path::new(PROGRAMS_DIR).join("Cargo.toml");
    let manifest = MANIFEST
        .get_or_init(|| fs::read_to_string(&manifest_path).expect("Could not read manifest"))
        .replacen("default", program_name, 1);
    fs::write(&manifest_path, manifest)?;

    // Build the program
    let output = Command::new("cargo-build-sbf")
        .args([
            "--manifest-path",
            manifest_path
                .to_str()
                .expect("Manifest path should always be UTF-8"),
            "--sbf-out-dir",
            program_path
                .to_str()
                .ok_or_else(|| anyhow!("{program_path:?} is not valid UTF-8"))?,
            "--offline",
        ])
        .output()?;

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
        .map_or_else(|e| (format!("Error: {e}"), None), |idl| (stderr, idl));
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
