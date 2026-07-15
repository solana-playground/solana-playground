// TODO: Switch to `pnpm`
// TODO: Version
// TODO: Sandbox
// TODO: All packages and all versions from NPM
// TODO: Accept `package.json` (and optionally a lock file) instead of name and version?
// TODO: Check if bundling client-side is feasible with a tool like `esbuild-wasm`?

use std::path::{Path, PathBuf};

use anyhow::anyhow;
use tokio::task;

use crate::{log::warn, utils::Files};

/// Packages directory
const PACKAGES_DIR: &str = "packages";

/// Build directory (`webpack`)
const BUILD_DIR: &str = "dist";

/// The default directory of where the JS packages are stored
const NODE_MODULES: &str = "node_modules";

/// Get or generate an ESM package.
pub async fn get_package(name: &str) -> anyhow::Result<String> {
    match read_package(name).await {
        Err(e) if e.kind() == tokio::io::ErrorKind::NotFound => build_package(name).await,
        res => res.map_err(|e| anyhow!("Unexpected error: `{name}`: {e}")),
    }
}

/// Read the generated package module file.
///
/// Packages can only exist if the [`build_package`] function has been run beforehand.
async fn read_package(name: &str) -> tokio::io::Result<String> {
    let path = get_package_out_path(name).join("index.js");
    tokio::fs::read_to_string(path).await
}

/// Build the package.
async fn build_package(name: &str) -> anyhow::Result<String> {
    use tokio::{fs, process::Command};

    let entry_path = Path::new("@solana-playground").join(name);
    let pkg_path = get_node_modules_path().join(&entry_path);
    let content = format!(
        r#"import * as mod from "{name}";
export default mod.default ?? mod;
export * from "{name}";"#
    );
    fs::create_dir_all(&pkg_path).await?;
    fs::write(pkg_path.join("index.js"), content).await?;

    let output = Command::new("yarn")
        .current_dir(PACKAGES_DIR)
        .arg("--offline")
        .arg("--ignore-scripts")
        .arg("run")
        .arg("webpack")
        .arg("--entry")
        .arg(entry_path)
        .arg("--output-filename")
        .arg(Path::new(name).join("index.js"))
        .output()
        .await?;

    if !output.status.success() {
        return Err(anyhow!(
            "Failed to build package: `{name}`: {}",
            String::from_utf8(output.stderr)?
        ));
    }

    read_package(name).await.map_err(Into::into)
}

/// Get or generate type declarations.
pub async fn get_types(name: &str) -> anyhow::Result<(Files, Vec<String>)> {
    match read_types(name).await {
        Err(e) if e.kind() == tokio::io::ErrorKind::NotFound => {
            let name = name.to_owned();
            task::spawn_blocking(move || generate_types(&name)).await?
        }
        res => res.map_err(|e| anyhow!("Unexpected error ({name}): {e}")),
    }
}

/// Read the generated types file.
///
/// Types can only exist if the [`generate_types`] function has been run beforehand.
async fn read_types(name: &str) -> tokio::io::Result<(Files, Vec<String>)> {
    use tokio::fs;

    let types_path = get_package_types_path(name);
    let deps_path = get_package_type_dependencies_path(name);
    let types = fs::read(types_path)
        .await
        .map(|b| serde_json::from_slice(&b))??;
    let deps = fs::read(deps_path)
        .await
        .map(|b| serde_json::from_slice(&b))??;
    Ok((types, deps))
}

/// Port of [`generate-packages.mjs`] (without the Monaco editor parts).
///
/// This function is intentionally synchronous due to recursion.
///
/// [`generate-packages.mjs`]: https://github.com/solana-playground/solana-playground/blob/7d9f365a5009fd65aaa388e85bc541e5f4f51ae9/client/scripts/generate-packages.mjs
fn generate_types(name: &str) -> anyhow::Result<(Files, Vec<String>)> {
    use std::fs;

    let node_modules = get_node_modules_path();

    // Node built-ins are handled differently because each file is a different module and we don't
    // need all of them
    let types_node_path = node_modules
        .join("@types")
        .join("node")
        .join(name)
        .with_extension("d.ts");
    if fs::exists(&types_node_path)? {
        let content = fs::read_to_string(&types_node_path)?;
        let files = convert_files(vec![(types_node_path, content)])?;
        fs::create_dir_all(get_package_out_path(name))?;
        fs::write(get_package_types_path(name), serde_json::to_string(&files)?)?;
        fs::write(get_package_type_dependencies_path(name), "[]")?;
        return Ok((files, vec![]));
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
            .map(convert_files)??;

        // Save type declarations
        fs::create_dir_all(get_package_out_path(name))?;
        fs::write(get_package_types_path(name), serde_json::to_string(&files)?)?;

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
                match generate_types(dep) {
                    Ok(_) => deps.push(dep.to_owned()),
                    Err(e) => warn!("Failed to generate types for dependency `{dep}`: {e}"),
                }
            }
        }

        // Save type dependencies
        fs::write(
            get_package_type_dependencies_path(name),
            serde_json::to_string(&deps)?,
        )?;

        return Ok((files, deps));
    }

    Err(anyhow!("Could not find type declarations ({name})"))
}

/// Get all type declaration files recursively.
///
/// This function is intentionally synchronous due to recursion.
fn get_all_declaration_files(path: &Path) -> std::io::Result<Vec<(PathBuf, String)>> {
    use std::fs;

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

/// Get the relative `node_modules` path.
fn get_node_modules_path() -> PathBuf {
    Path::new(PACKAGES_DIR).join(NODE_MODULES)
}

/// Get the path to the directory that stores the output package.
fn get_package_out_path(name: &str) -> PathBuf {
    Path::new(PACKAGES_DIR).join(BUILD_DIR).join(name)
}

/// Get the path to the file that stores all types of the given package in a single file.
fn get_package_types_path(name: &str) -> PathBuf {
    get_package_out_path(name).join("types.json")
}

/// Get the path to the file that stores the package's type dependencies.
fn get_package_type_dependencies_path(name: &str) -> PathBuf {
    get_package_out_path(name).join("dependencies.json")
}

/// Convert files to the expected format.
fn convert_files(files: Vec<(PathBuf, String)>) -> anyhow::Result<Files> {
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
