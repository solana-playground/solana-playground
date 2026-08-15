// TODO: Version
// TODO: All packages and versions from NPM
// TODO: Verify package names and versions are valid
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

/// `package.json`
pub const MANIFEST_FILE: &str = "package.json";

/// Path to the lock file (currently only `yarn`)
pub const LOCK_FILE: &str = "yarn.lock";

/// Bundled files
pub const BUNDLE_FILE: &str = "bundle.json";

/// Type declarations
pub const TYPES_FILE: &str = "types.json";

/// Type dependencies
pub const DEPENDENCIES_FILE: &str = "dependencies.json";

/// Get the relative `node_modules` path.
pub fn get_node_modules_path() -> PathBuf {
    Path::new(PACKAGES_DIR).join(NODE_MODULES)
}

/// Get the path to the directory that stores the `webpack` build directory.
pub fn get_build_path() -> PathBuf {
    Path::new(PACKAGES_DIR).join(BUILD_DIR)
}
