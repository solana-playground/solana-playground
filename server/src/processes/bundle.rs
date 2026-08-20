use std::{
    collections::HashMap,
    fs::{self, DirEntry},
    io,
    path::{Path, PathBuf},
    process::Command,
};

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use solpg_server::{
    package::{get_out_path, BUNDLE_FILE, LOCK_FILE, MANIFEST_FILE, PACKAGES_DIR, TYPES_FILE},
    utils::Files,
};

// TODO: Make the process output a single compressed archive with all the files in it
fn main() -> Result<()> {
    let manifest = install_packages()?;
    generate_bundle(&manifest)?;
    generate_types(&manifest)?;
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

impl Manifest {
    /// Combine all dependencies into a single map.
    fn get_all_dependencies(&self) -> Dependencies {
        let mut deps = Dependencies::default();
        deps.extend(self.dependencies.clone());
        deps.extend(self.dev_dependencies.clone());
        deps.extend(self.peer_dependencies.clone());
        deps.extend(self.optional_dependencies.clone());
        deps
    }
}

/// `package.json` dependencies map
type Dependencies = HashMap<String, String>;

/// Install packages.
fn install_packages() -> Result<Manifest> {
    // TODO: Install
    // TODO: Validate?

    let packages_path = Path::new(PACKAGES_DIR);
    let out_path = get_out_path();
    fs::create_dir_all(&out_path)?;

    let manifest_path = packages_path.join(MANIFEST_FILE);
    fs::copy(&manifest_path, out_path.join(MANIFEST_FILE))?;

    let lock_file_path = packages_path.join(LOCK_FILE);
    fs::copy(lock_file_path, out_path.join(LOCK_FILE))?;

    fs::read(manifest_path)
        .map(|b| serde_json::from_slice(&b))?
        .map_err(Into::into)
}

/// Generate an ESM bundle.
fn generate_bundle(manifest: &Manifest) -> Result<()> {
    // Create a separate directory for each package
    let packages_path = Path::new(PACKAGES_DIR);
    let src_path = packages_path.join(SRC_DIR);
    let mut entries = vec![];
    // TODO: Other deps (`optionalDependencies`...)
    for pkg in manifest.dependencies.keys() {
        let module = to_module_name(pkg);
        let pkg_path = src_path.join(pkg);
        let entry_path = pkg_path.join("index.js");
        fs::create_dir_all(&pkg_path)?;
        fs::write(
            &entry_path,
            format!(r#"import * as {module} from "{pkg}"; export {{ {module} }}"#),
        )?;
        entries.push(format!(
            r#""{pkg}": {:?}"#,
            entry_path
                .strip_prefix(PACKAGES_DIR)
                .map(|entry| Path::new(".").join(entry))?
        ));
    }

    // Add entries to the webpack config
    let webpack_cfg_path = packages_path.join(WEBPACK_CONFIG_FILE);
    let webpack_cfg = fs::read_to_string(&webpack_cfg_path)?
        .replace("/* <DYNAMIC_ENTRIES> */", &entries.join(","));
    fs::write(webpack_cfg_path, webpack_cfg)?;

    // TODO: Test `webpack` alternatives for faster builds
    let status = Command::new("yarn")
        .current_dir(PACKAGES_DIR)
        .arg("--offline")
        .arg("--ignore-scripts")
        .arg("run")
        .arg("webpack")
        .status()?;

    if !status.success() {
        return Err(anyhow!("Failed to bundle"));
    }

    let files = get_output_files(|entry| {
        entry
            .path()
            .extension()
            .map(|ext| ext == "js")
            .unwrap_or_default()
    })?;
    fs::write(
        get_out_path().join(BUNDLE_FILE),
        serde_json::to_string(&files)?,
    )?;

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

/// Get the output files from the build directory.
fn get_output_files<F>(filter: F) -> Result<Files>
where
    F: Fn(&DirEntry) -> bool,
{
    let build_path = get_build_path();
    let mut files = vec![];
    extend_files(&mut files, &build_path, &filter)?;
    Files::try_from(files)
}

/// Recursively extend the given files from the output directory.
fn extend_files<F>(files: &mut Vec<(PathBuf, String)>, path: &Path, filter: &F) -> Result<()>
where
    F: Fn(&DirEntry) -> bool,
{
    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let path = entry.path();
        let file_type = entry.file_type()?;
        if file_type.is_dir() {
            extend_files(files, &path, filter)?;
        } else if file_type.is_file() {
            if filter(&entry) {
                let content = fs::read_to_string(&path)?;
                let path = path.strip_prefix(get_build_path())?.to_owned();
                files.push((path, content));
            }
        } else {
            eprintln!("Unexpected file type: {file_type:?}");
        }
    }

    Ok(())
}

/// Generate type declaration files.
fn generate_types(manifest: &Manifest) -> Result<()> {
    for dep in manifest.get_all_dependencies().keys() {
        if let Err(e) = generate_package_types(dep) {
            eprintln!("Failed to generate types for `{dep}`: {e}")
        }
    }

    let files = get_output_files(|entry| {
        let file_name = entry.file_name();
        file_name == TYPES_FILE || file_name == DEPENDENCIES_FILE
    })?;
    fs::write(
        get_out_path().join(TYPES_FILE),
        serde_json::to_string(&files)?,
    )?;

    Ok(())
}

/// Port of [`generate-packages.mjs`] (without the Monaco editor parts).
///
/// [`generate-packages.mjs`]: https://github.com/solana-playground/solana-playground/blob/7d9f365a5009fd65aaa388e85bc541e5f4f51ae9/client/scripts/generate-packages.mjs
fn generate_package_types(name: &str) -> Result<()> {
    let build_path = get_build_path();
    let out_path = build_path.join(name);
    let types_path = out_path.join(TYPES_FILE);
    let deps_path = out_path.join(DEPENDENCIES_FILE);

    // Node built-ins are handled differently because each file is a different module and we don't
    // need all of them
    let node_modules = Path::new(PACKAGES_DIR).join(NODE_MODULES);
    let types_node_path = node_modules
        .join("@types")
        .join("node")
        .join(name)
        .with_extension("d.ts");
    if fs::exists(&types_node_path)? {
        let content = fs::read_to_string(&types_node_path)?;
        let files = convert_type_files(vec![(types_node_path, content)])?;
        fs::create_dir_all(out_path)?;
        fs::write(types_path, serde_json::to_string(&files)?)?;
        fs::write(deps_path, "[]")?;
        return Ok(());
    }

    let pkg_roots = [&node_modules, &node_modules.join("@types")];
    for pkg_root in pkg_roots {
        let pkg_path = pkg_root.join(name);
        let manifest = match fs::read(pkg_path.join(MANIFEST_FILE)) {
            Ok(b) => serde_json::from_slice::<Manifest>(&b)?,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => continue,
            Err(e) => return Err(anyhow!("Unexpected fs error: {e}")),
        };

        let type_root = manifest
            .types
            .as_ref()
            .ok_or_else(|| anyhow!("Unexpected `types` field: `{name}`"))
            .map(Path::new)
            .map(|type_root| pkg_path.join(type_root))?;
        let files = get_all_declaration_files(&type_root)
            .map_err(|e| anyhow!("Failed to get type paths: `{name}`: {e}"))
            .map(convert_type_files)??;

        // Save type declarations
        fs::create_dir_all(out_path)?;
        fs::write(types_path, serde_json::to_string(&files)?)?;

        // Get transitive dependencies that are being referenced in type declarations
        let deps = manifest
            .get_all_dependencies()
            .keys()
            // TODO: Make this more robust (if necesssary)
            .filter(|dep| files.iter().any(|(_, content)| content.contains(*dep)))
            .fold(vec![], |mut acc, dep| {
                match generate_package_types(dep) {
                    Ok(_) => acc.push(dep.to_owned()),
                    Err(e) => eprintln!("Failed to generate types for `{dep}`: {e}"),
                }

                acc
            });

        // Save type dependencies
        fs::write(deps_path, serde_json::to_string(&deps)?)?;

        return Ok(());
    }

    Err(anyhow!("Could not find type declarations ({name})"))
}

/// Get all type declaration files recursively.
fn get_all_declaration_files(path: &Path) -> io::Result<Vec<(PathBuf, String)>> {
    let mut files = vec![];
    let initial_path = path;

    let path = if fs::metadata(path)?.is_file() {
        // Make the type root always the first file
        let content = fs::read_to_string(path)?;
        files.push((path.to_owned(), content));
        path.parent().expect("Always has a parent")
    } else {
        path
    };
    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let path = entry.path();
        if path == initial_path {
            // Skip duplicating the type root file
            continue;
        }

        let file_type = entry.file_type()?;
        if file_type.is_dir() {
            if path.ends_with(NODE_MODULES) {
                continue;
            }

            files.extend_from_slice(&get_all_declaration_files(&path)?);
        } else if entry
            .file_name()
            .to_str()
            .map(|name| name.ends_with(".d.ts"))
            .unwrap_or_default()
        {
            let content = fs::read_to_string(&path)?;
            files.push((path, content));
        }
    }

    Ok(files)
}

/// Convert files to the expected format.
fn convert_type_files(files: Vec<(PathBuf, String)>) -> anyhow::Result<Files> {
    // TODO: Sort alphabetically for consistent output?
    // TODO: Remove `node_modules` prefix?
    files
        .into_iter()
        .map(|(path, content)| {
            let path = path.canonicalize()?;
            let Some(path) = path.to_str() else {
                return Err(anyhow!("Failed to convert path to string: {path:?}"));
            };
            let Some(index) = path.rfind(NODE_MODULES) else {
                return Err(anyhow!("Invalid path: {path:?}"));
            };

            let path = path[index..].to_owned();
            Ok((path, content))
        })
        .collect()
}

/// Build directory (`webpack`)
const BUILD_DIR: &str = "dist";

/// `weppack` config file
const WEBPACK_CONFIG_FILE: &str = "webpack.config.js";

/// The default directory of where the JS packages are stored
const NODE_MODULES: &str = "node_modules";

/// Source directory
const SRC_DIR: &str = "src";

/// Type dependencies
const DEPENDENCIES_FILE: &str = "dependencies.json";

/// Get the path to the directory that stores the `webpack` build directory.
fn get_build_path() -> PathBuf {
    Path::new(PACKAGES_DIR).join(BUILD_DIR)
}
