// TODO: Version
// TODO: All packages and versions from NPM
// TODO: Verify package names and versions are valid
// TODO: Accept `package.json` (and optionally a lock file) instead of name and version?
// TODO: Switch to `pnpm` without shared cache (simpler transition if we decide to use shared cache)
// TODO: Use shared cache with `pnpm`? (shared cache is better for speed but worse for security)
// TODO: Check if bundling client-side is feasible with a tool like `esbuild-wasm`?

use std::path::{Path, PathBuf};

/// Packages directory
pub const PACKAGES_DIR: &str = "packages";

/// Build directory (`webpack`)
const BUILD_DIR: &str = "dist";

/// The default directory of where the JS packages are stored
pub const NODE_MODULES: &str = "node_modules";

/// Get the relative `node_modules` path.
pub fn get_node_modules_path() -> PathBuf {
    Path::new(PACKAGES_DIR).join(NODE_MODULES)
}

/// Get the path to the directory that stores the `webpack` build directory.
pub fn get_build_path() -> PathBuf {
    Path::new(PACKAGES_DIR).join(BUILD_DIR)
}

/// Get the path to the directory that stores the output package.
pub fn get_package_out_path(name: &str) -> PathBuf {
    get_build_path().join(name)
}

/// Get the path to the output file that stores all types of the given package in a single file.
pub fn get_package_out_types_path(name: &str) -> PathBuf {
    get_package_out_path(name).join("types.json")
}

/// Get the path to the output file that stores the package's type dependencies.
pub fn get_package_out_type_dependencies_path(name: &str) -> PathBuf {
    get_package_out_path(name).join("dependencies.json")
}
