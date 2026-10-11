use std::{
    collections::{HashMap, HashSet},
    env,
    fs::{self, DirEntry},
    io,
    path::{Path, PathBuf, MAIN_SEPARATOR_STR},
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
    let args = Args::from_env()?;
    match args {
        Args::Install { command } => run_package_manager_command(command),
        Args::Build => {
            let manifest_path = Path::new(PACKAGES_DIR).join(MANIFEST_FILE);
            let manifest = fs::read(manifest_path).map(|b| serde_json::from_slice(&b))??;
            generate_bundle(&manifest)?;
            generate_types(&manifest)?;
            Ok(())
        }
    }
}

enum Args {
    Install { command: Vec<String> },
    Build,
}

impl Args {
    fn from_env() -> Result<Self> {
        let mut args = env::args();
        if args.next().is_none() {
            return Err(anyhow!("Missing program"));
        };
        let Some(step) = args.next() else {
            return Err(anyhow!("Missing step"));
        };
        let args = match step.as_str() {
            "install" => Self::Install {
                command: args.collect(),
            },
            "build" => Self::Build,
            _ => return Err(anyhow!("Invalid step: {step}")),
        };

        Ok(args)
    }
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
    main: Option<String>,
    #[serde(default)]
    types: Option<String>,
    #[serde(default)]
    typings: Option<String>,
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

/// Run the package manager command.
fn run_package_manager_command(command: Vec<String>) -> Result<()> {
    // TODO: Only match command name once (merge with the command runner path)
    let lock_file_name = match command.get(0).map(|s| s.as_str()).unwrap_or("npm") {
        "npm" => "package-lock.json",
        "yarn" => "yarn.lock",
        name => return Err(anyhow!("Unsupported package manager: `{name}`")),
    };
    let packages_path = Path::new(PACKAGES_DIR);
    let lock_file_in_path = packages_path.join(LOCK_FILE);
    let lock_file_real_path = packages_path.join(lock_file_name);
    if fs::exists(&lock_file_in_path)? {
        fs::rename(lock_file_in_path, &lock_file_real_path)?;
    }

    match command.as_slice() {
        [name, args @ ..] => match name.as_str() {
            "npm" => {
                match args {
                    [command, args @ ..] => match command.as_str() {
                        "install" => run_npm(
                            command,
                            args,
                            &[
                                "--save-dev",
                                "-D",
                                "--save-peer", // `-P` is `--save-prod` which is useless
                                "--save-optional",
                                "-O",
                            ],
                        )?,
                        "uninstall" | "update" => run_npm(command, args, &[])?,
                        _ => return Err(anyhow!("Unsupported command: `{command}`")),
                    },
                    // Empty `npm` defaults to help output
                    _ => return Err(anyhow!("Expected a command")),
                }
            }
            "yarn" => {
                match args {
                    [command, args @ ..] => match command.as_str() {
                        "add" => run_yarn(
                            command,
                            args,
                            &["--dev", "-D", "--peer", "-P", "--optional", "-O"],
                        )?,
                        "install" | "remove" | "upgrade" => run_yarn(command, args, &[])?,
                        _ => return Err(anyhow!("Unsupported command: `{command}`")),
                    },
                    // Empty `yarn` defaults to install
                    _ => run_yarn("install", &[], &[])?,
                }
            }
            _ => return Err(anyhow!("Unsupported package manager: `{name}`")),
        },
        // No `command` defaults to `npm install`
        _ => run_npm("install", &[], &[])?,
    }

    let out_path = get_out_path();
    fs::create_dir_all(&out_path)?;
    fs::copy(
        packages_path.join(MANIFEST_FILE),
        out_path.join(MANIFEST_FILE),
    )?;
    fs::copy(lock_file_real_path, out_path.join(LOCK_FILE))?;

    Ok(())
}

/// Run the given `npm` command using safe(r) defaults.
///
/// # Safety
///
/// Scripts are ignored and only `allowed_options` are accepted, but arguments are passed in to the
/// command as-is without any additional sanitization.
fn run_npm(command: &str, args: &[String], allowed_options: &[&'static str]) -> Result<()> {
    check_allowed_options(args, allowed_options)?;

    let status = Command::new("npm")
        .current_dir(PACKAGES_DIR)
        .arg("--ignore-scripts")
        .arg(command)
        .args(args)
        .status()?;
    if !status.success() {
        return Err(anyhow!("Failed to {command}"));
    }

    Ok(())
}

/// Run the given `yarn` command using safe(r) defaults.
///
/// # Safety
///
/// Scripts are ignored and only `allowed_options` are accepted, but arguments are passed in to the
/// command as-is without any additional sanitization.
fn run_yarn(command: &str, args: &[String], allowed_options: &[&'static str]) -> Result<()> {
    check_allowed_options(args, allowed_options)?;

    let status = Command::new("yarn")
        .current_dir(PACKAGES_DIR)
        .arg("--ignore-scripts")
        .arg("--prefer-offline")
        .arg(command)
        .args(args)
        .status()?;
    if !status.success() {
        return Err(anyhow!("Failed to {command}"));
    }

    Ok(())
}

/// Check that only the options specified in `allowed_options` are allowed to be passed in.
fn check_allowed_options(args: &[String], allowed_options: &[&'static str]) -> Result<()> {
    if let Some(opt) = args
        .iter()
        .map(|arg| arg.trim())
        .filter(|arg| arg.starts_with('-'))
        .find(|arg| !allowed_options.iter().any(|opt| opt == arg))
    {
        return Err(anyhow!("Invalid option: `{opt}`"));
    }

    Ok(())
}

/// Generate an ESM bundle.
fn generate_bundle(manifest: &Manifest) -> Result<()> {
    // Create a separate directory for each package
    let packages_path = Path::new(PACKAGES_DIR);
    let src_path = packages_path.join(SRC_DIR);
    let mut entries = vec![];
    for pkg in manifest.get_all_dependencies().keys() {
        // Skip the `@types` organization
        if pkg.starts_with("@types") {
            continue;
        }

        // Skip other type only packages
        let manifest_path = packages_path
            .join(NODE_MODULES)
            .join(pkg)
            .join(MANIFEST_FILE);
        let manifest =
            fs::read(manifest_path).map(|b| serde_json::from_slice::<Manifest>(&b))??;
        let is_type_only = manifest
            .main
            .map(|main| main.is_empty())
            .unwrap_or_default()
            && manifest.types.is_some();
        if is_type_only {
            continue;
        }

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
    let status = Command::new("webpack").current_dir(PACKAGES_DIR).status()?;
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
///
/// Currently, the server tries to collect the minimum amount of type files instead of serving all
/// type declaration files inside `node_modules`. This is a design decision to make the types as
/// light as possible, as the the target client is a web browser.
fn generate_types(manifest: &Manifest) -> Result<()> {
    let mut cache = HashSet::new();
    for dep in manifest.get_all_dependencies().keys() {
        if let Err(e) = generate_package_types(dep, &mut cache) {
            eprintln!("Failed to generate types for `{dep}`: {e}")
        }
    }

    let files = get_output_files(|entry| {
        let file_name = entry.file_name();
        file_name == MANIFEST_FILE || file_name == TYPES_FILE
    })?;
    fs::write(
        get_out_path().join(TYPES_FILE),
        serde_json::to_string(&files)?,
    )?;

    Ok(())
}

/// Port of [`generate-packages.mjs`] (without the Monaco editor parts).
///
/// Packages are cached eagerly without waiting for their results. This function will return `Ok`
/// if the package is cached, even if there was an error.
///
/// [`generate-packages.mjs`]: https://github.com/solana-playground/solana-playground/blob/7d9f365a5009fd65aaa388e85bc541e5f4f51ae9/client/scripts/generate-packages.mjs
fn generate_package_types(name: &str, cache: &mut HashSet<String>) -> Result<()> {
    if cache.contains(name) {
        return Ok(());
    }

    // Always cache independent of failure because the process will almost certainly return an error
    // in all subsequent calls if the first one was an error. This also fixes potential infinite
    // recursion when type generation fails for both circular dependencies.
    cache.insert(name.to_owned());

    // Get manifest
    let pkg_path = Path::new(PACKAGES_DIR).join(NODE_MODULES).join(name);
    let manifest_path = pkg_path.join(MANIFEST_FILE);
    let manifest = match fs::read(&manifest_path) {
        Ok(b) => serde_json::from_slice::<Manifest>(&b)?,
        Err(e) if e.kind() == io::ErrorKind::NotFound => return Err(anyhow!("No manifest")),
        Err(e) => return Err(anyhow!("Unexpected fs error: {e}")),
    };

    // Get type declarations
    let files = manifest
        .types
        .as_ref()
        .or(manifest.typings.as_ref())
        .ok_or_else(|| anyhow!("Failed to find type root"))
        .map(Path::new)
        .map(|type_root| pkg_path.join(type_root))
        .map(|type_root| get_all_declaration_files(&type_root))?
        .map_err(|e| anyhow!("Failed to get type paths: {e}"))
        .map(convert_type_files)??;

    // Get output paths
    let out_path = get_build_path().join(name);
    let types_out_path = out_path.join(TYPES_FILE);
    let manifest_out_path = out_path.join(MANIFEST_FILE);

    // Save type declarations
    fs::create_dir_all(out_path)?;
    fs::write(types_out_path, serde_json::to_string(&files)?)?;

    // Get transitive dependencies that are being referenced in type declarations
    manifest
        .get_all_dependencies()
        .into_keys()
        // TODO: Make this more robust (if necesssary)
        .filter(|dep| files.iter().any(|(_, content)| content.contains(dep)))
        .for_each(|dep| {
            if let Err(e) = generate_package_types(&dep, cache) {
                eprintln!("Failed to generate types for `{dep}`: {e}")
            }
        });

    // Copy the manifest
    fs::copy(manifest_path, manifest_out_path)?;

    Ok(())
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
fn convert_type_files(files: Vec<(PathBuf, String)>) -> Result<Files> {
    // TODO: Sort alphabetically for consistent output?
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

            let after_node_modules_index = index + NODE_MODULES.len() + MAIN_SEPARATOR_STR.len();
            let path = path[after_node_modules_index..].to_owned();
            Ok((path, content))
        })
        .collect()
}

/// Build directory (`webpack`)
const BUILD_DIR: &str = "dist";

/// Base `webpack` config file
const WEBPACK_CONFIG_FILE: &str = "webpack.config.js";

/// The default directory of where the JS packages are stored
const NODE_MODULES: &str = "node_modules";

/// Source directory
const SRC_DIR: &str = "src";

/// Get the path to the directory that stores the `webpack` build directory.
fn get_build_path() -> PathBuf {
    Path::new(PACKAGES_DIR).join(BUILD_DIR)
}
