// TODO: All packages and versions from NPM
// TODO: Switch to `pnpm` without shared cache (simpler transition if we decide to use shared cache)
// TODO: Use shared cache with `pnpm`? (shared cache is better for speed but worse for security)
// TODO: Check if bundling client-side is feasible with a tool like `esbuild-wasm`?

use std::path::{Path, PathBuf};

/// Packages directory
pub const PACKAGES_DIR: &str = "packages";

/// Process output directory
const OUT_DIR: &str = "out";

/// `package.json`
pub const MANIFEST_FILE: &str = "package.json";

/// Path to the lock file (currently only `yarn`)
pub const LOCK_FILE: &str = "yarn.lock";

/// Bundled files
pub const BUNDLE_FILE: &str = "bundle.json";

/// Type declarations
pub const TYPES_FILE: &str = "types.json";

/// Get the path to the process output directory.
pub fn get_out_path() -> PathBuf {
    Path::new(PACKAGES_DIR).join(OUT_DIR)
}
