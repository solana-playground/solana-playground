use std::{env, fs, path::PathBuf};

use anyhow::{anyhow, Result};
use solpg_server::{
    templates::{get_template, Template},
    utils::Files,
};

fn main() -> Result<()> {
    let args = Args::from_env()?;
    build(&args)
}

struct Args {
    template: &'static Template,
    files: Files,
    binary_path: PathBuf,
    idl_path: PathBuf,
    build_args: Vec<String>,
}

impl Args {
    fn from_env() -> Result<Self> {
        let mut args = env::args();
        if args.next().is_none() {
            return Err(anyhow!("Missing program"));
        };

        let template = args
            .next()
            .ok_or_else(|| anyhow!("Missing template name"))
            .map(get_template)?
            .ok_or_else(|| anyhow!("Invalid template name"))?;
        let files = args
            .next()
            .ok_or_else(|| anyhow!("Missing files path"))
            .map(fs::read)?
            .map(|bytes| serde_json::from_slice(&bytes))??;
        let binary_path = args
            .next()
            .ok_or_else(|| anyhow!("Missing binary path"))
            .map(PathBuf::from)?;
        let idl_path = args
            .next()
            .ok_or_else(|| anyhow!("Missing idl path"))
            .map(PathBuf::from)?;
        let build_args = args.collect();

        Ok(Self {
            template,
            files,
            binary_path,
            idl_path,
            build_args,
        })
    }
}

/// Build the program from the given files.
///
/// NOTE: This function doesn't return an error in the case of a compiler error.
fn build(args: &Args) -> Result<()> {
    let template = args.template;

    // Write files
    let program_path = template.program_path();
    for (path, content) in &args.files {
        let relative_path = path.trim_start_matches('/');
        let path = program_path.join(relative_path);
        let parent_path = path
            .parent()
            .ok_or_else(|| anyhow!("No parent: {path:?}"))?;
        fs::create_dir_all(parent_path)?;
        fs::write(path, content)?;
    }

    // Build
    let status = template.processor().build(&args.build_args)?;
    if !status.success() {
        // Compilation errors are expected; others are not
        return Ok(());
    }

    // Move files to the expected output location
    //
    // 1. Move binary
    let binary_path = 'outer: {
        for entry in fs::read_dir(template.binary_path())? {
            let path = entry?.path();
            if path.extension().map(|ext| ext == "so").unwrap_or_default() {
                break 'outer path;
            }
        }

        return Err(anyhow!("Unable to find program binary"));
    };
    fs::create_dir_all(args.binary_path.parent().expect("Always has parent"))?;
    fs::rename(&binary_path, &args.binary_path)?;

    // 2. Move IDL
    if let Some(idl_path) = template.idl_path() {
        let idl_path = 'outer: {
            for entry in fs::read_dir(idl_path)? {
                let path = entry?.path();
                if path
                    .extension()
                    .map(|ext| ext == "json")
                    .unwrap_or_default()
                {
                    break 'outer path;
                }
            }

            return Err(anyhow!("Unable to find IDL"));
        };

        fs::create_dir_all(args.idl_path.parent().expect("Always has parent"))?;
        fs::rename(&idl_path, &args.idl_path)?;
    }

    Ok(())
}
