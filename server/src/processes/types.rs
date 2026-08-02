use std::{
    env, fs, io,
    path::{Path, PathBuf},
};

use anyhow::{anyhow, Result};
use solpg_server::{
    log::warn,
    package::{
        get_node_modules_path, get_package_out_path, get_package_out_type_dependencies_path,
        get_package_out_types_path, NODE_MODULES,
    },
    utils::Files,
};

fn main() -> anyhow::Result<()> {
    let args = Args::from_env()?;
    generate_types(&args.name)
}

struct Args {
    name: String,
}

impl Args {
    fn from_env() -> Result<Self> {
        let mut args = env::args();
        if args.next().is_none() {
            return Err(anyhow!("Missing binary"));
        };
        let Some(name) = args.next() else {
            return Err(anyhow!("Missing name"));
        };

        Ok(Self { name })
    }
}

/// Port of [`generate-packages.mjs`] (without the Monaco editor parts).
///
/// This function is intentionally synchronous due to recursion.
///
/// [`generate-packages.mjs`]: https://github.com/solana-playground/solana-playground/blob/7d9f365a5009fd65aaa388e85bc541e5f4f51ae9/client/scripts/generate-packages.mjs
fn generate_types(name: &str) -> Result<()> {
    let node_modules = get_node_modules_path();
    let types_path = get_package_out_types_path(name);
    let deps_path = get_package_out_type_dependencies_path(name);

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
            .map(convert_files)??;

        // Save type declarations
        fs::create_dir_all(get_package_out_path(name))?;
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
                match generate_types(dep) {
                    Ok(_) => deps.push(dep.to_owned()),
                    Err(e) => warn!("Failed to generate types for dependency `{dep}`: {e}"),
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
