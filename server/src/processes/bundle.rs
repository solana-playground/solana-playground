use std::{
    collections::HashMap,
    fs, io,
    path::{Path, PathBuf},
    process::Command,
};

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use solpg_server::{
    package::{
        get_build_path, get_node_modules_path, BUNDLE_FILE, DEPENDENCIES_FILE, MANIFEST_FILE,
        NODE_MODULES, PACKAGES_DIR, TYPES_FILE,
    },
    utils::Files,
};

// TODO: Make the process output a single compressed archive with all the files in it
fn main() -> Result<()> {
    let manifest_path = Path::new(PACKAGES_DIR).join(MANIFEST_FILE);
    let manifest = fs::read(manifest_path).map(|b| serde_json::from_slice(&b))??;
    install_packages()?;
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
fn install_packages() -> Result<()> {
    // TODO: install
    Ok(())
}

/// Generate an ESM bundle.
fn generate_bundle(manifest: &Manifest) -> Result<()> {
    let entry_path = Path::new(&manifest.name);
    let pkg_path = get_node_modules_path().join(entry_path);
    // TODO: Other deps (`optionalDependencies`...)
    // TODO: Make packages lazy-loadable
    // TODO: Bundle each package to a separate directory
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

/// Generate type declaration files.
fn generate_types(manifest: &Manifest) -> Result<()> {
    for dep in manifest.get_all_dependencies().keys() {
        if let Err(e) = generate_package_types(dep) {
            eprintln!("Failed to generate types for `{dep}`: {e}")
        }
    }

    let build_path = get_build_path();
    let mut types = vec![];
    extend_generated_types(&mut types, &build_path)?;
    let types = Files::try_from(types)?;
    fs::write(build_path.join(TYPES_FILE), serde_json::to_string(&types)?)?;

    Ok(())
}

/// Port of [`generate-packages.mjs`] (without the Monaco editor parts).
///
/// [`generate-packages.mjs`]: https://github.com/solana-playground/solana-playground/blob/7d9f365a5009fd65aaa388e85bc541e5f4f51ae9/client/scripts/generate-packages.mjs
fn generate_package_types(name: &str) -> Result<()> {
    let node_modules = get_node_modules_path();
    let build_path = get_build_path();
    let out_path = build_path.join(name);
    let types_path = out_path.join(TYPES_FILE);
    let deps_path = out_path.join(DEPENDENCIES_FILE);

    // Node built-ins are handled differently because each file is a different module and we don't
    // need all of them
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
        let pkg_json = match fs::read(pkg_path.join("package.json")) {
            Ok(b) => serde_json::from_slice::<serde_json::Value>(&b)?,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => continue,
            Err(e) => return Err(anyhow!("Unexpected fs error: {e}")),
        };
        let Some(types) = pkg_json.get("types") else {
            continue;
        };

        let type_root = types
            .as_str()
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
        let mut deps = vec![];
        for dep_key in [
            "dependencies",
            "devDependencies",
            "peerDependencies",
            "optionalDependencies",
        ] {
            let Some(dep) = pkg_json.get(dep_key) else {
                continue;
            };
            let Some(dep) = dep.as_object() else {
                return Err(anyhow!("Unexpected dependency value: `{dep_key}`"));
            };

            for dep in dep
                .keys()
                // TODO: Make this more robust (if necesssary)
                .filter(|dep| files.iter().any(|(_, content)| content.contains(*dep)))
            {
                // Not all dependencies have types
                match generate_package_types(dep) {
                    Ok(_) => deps.push(dep.to_owned()),
                    Err(e) => eprintln!("Failed to generate types for dependency `{dep}`: {e}"),
                }
            }
        }

        // Save type dependencies
        fs::write(deps_path, serde_json::to_string(&deps)?)?;

        return Ok(());
    }

    Err(anyhow!("Could not find type declarations ({name})"))
}

/// Get all type declaration files recursively.
///
/// This function is intentionally synchronous due to recursion.
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

/// Recursively extend the given types from the created files.
fn extend_generated_types(types: &mut Vec<(PathBuf, String)>, path: &Path) -> Result<()> {
    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let path = entry.path();
        let file_type = entry.file_type()?;
        if file_type.is_dir() {
            extend_generated_types(types, &path)?;
        } else if file_type.is_file() {
            let file_name = entry.file_name();
            if file_name == TYPES_FILE || file_name == DEPENDENCIES_FILE {
                let content = fs::read_to_string(&path)?;
                let path = path.strip_prefix(get_build_path())?.to_owned();
                types.push((path, content));
            }
        } else {
            eprintln!("Unexpected file type: {file_type:?}");
        }
    }

    Ok(())
}
