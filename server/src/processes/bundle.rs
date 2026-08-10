use std::{collections::HashMap, fs, path::Path, process::Command};

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use solpg_server::{
    package::{get_build_path, get_node_modules_path, BUNDLE_FILE, MANIFEST_FILE, PACKAGES_DIR},
    utils::Files,
};

fn main() -> Result<()> {
    let manifest_path = Path::new(PACKAGES_DIR).join(MANIFEST_FILE);
    let manifest = fs::read(manifest_path).map(|b| serde_json::from_slice(&b))??;
    install_packages()?;
    generate_bundle(&manifest)?;
    Ok(())
}

/// `package.json` manifest
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct Manifest {
    name: String,
    #[serde(default)]
    dependencies: Dependencies,
    #[serde(default)]
    dev_dependencies: Dependencies,
    #[serde(default)]
    peer_dependencies: Dependencies,
    #[serde(default)]
    optional_dependencies: Dependencies,
    #[serde(default)]
    types: Option<String>,
}

/// `package.json` dependency map
type Dependencies = HashMap<String, String>;

/// Install packages.
fn install_packages() -> Result<()> {
    // TODO: install
    Ok(())
}

/// Generate an ESM bundle.
fn generate_bundle(manifest: &Manifest) -> Result<()> {
    let entry_path = Path::new(&manifest.name);
    let pkg_path = get_node_modules_path().join(entry_path);
    // TODO: Other deps (`optionalDependencies`...)
    let (imports, exports) = manifest
        .dependencies
        .keys()
        .map(|pkg| (pkg, to_module_name(pkg)))
        .fold(
            (String::new(), String::new()),
            |(mut imports, mut exports), (pkg, module)| {
                imports.push_str(&format!(r#"import * as {module} from "{pkg}";"#));

                if !exports.is_empty() {
                    exports.push(',');
                }
                exports.push_str(&module);

                (imports, exports)
            },
        );
    fs::create_dir_all(&pkg_path)?;
    fs::write(
        pkg_path.join("index.js"),
        format!(r#"{imports} export {{ {exports} }}"#),
    )?;

    // TODO: Create a separate entrypoint for each package for better lazy-loading
    let status = Command::new("yarn")
        .current_dir(PACKAGES_DIR)
        .arg("--offline")
        .arg("--ignore-scripts")
        .arg("run")
        .arg("webpack")
        .arg("--entry")
        .arg(entry_path)
        .arg("--output-filename")
        .arg("bundle.js")
        .status()?;

    if !status.success() {
        return Err(anyhow!("Failed to bundle"));
    }

    let build_path = get_build_path();
    let mut files = vec![];
    for entry in fs::read_dir(&build_path)? {
        let entry = entry?;
        let path = entry.path();
        let content = fs::read_to_string(&path)?;
        let path = path.strip_prefix(&build_path)?.to_owned();
        files.push((path, content));
    }
    let files = Files::try_from(files)?;
    fs::write(build_path.join(BUNDLE_FILE), serde_json::to_string(&files)?)?;

    Ok(())
}

/// Convert the given package name to a module name.
///
/// Module names must be valid JS variable names.
///
/// NOTE: This must be kept in sync with the client.
//
// TODO: It might be better to include a mapping of package names to module names as a separate file
fn to_module_name(pkg_name: &str) -> String {
    pkg_name.replace(['@', '/', '-', '_', '.'], "")
}
