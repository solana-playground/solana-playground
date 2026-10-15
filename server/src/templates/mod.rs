mod anchor;
mod legacy;

use std::{fs, path::Path, process::ExitStatus, sync::LazyLock};

use anchor::*;
use anyhow::Result;
use legacy::*;

/// All templates
static ALL: LazyLock<Vec<Template>> = LazyLock::new(|| {
    vec![
        Legacy::template(),
        Anchor0_29_0::template(),
        Anchor1_2_1::template(),
    ]
});

/// Get all templates.
///
/// The templates are initialized lazily only once and referenced for all subsequent calls.
pub fn get_all_templates() -> &'static [Template] {
    &ALL
}

/// Get the template from its name.
pub fn get_template(name: impl AsRef<str>) -> Option<&'static Template> {
    let name = name.as_ref();
    ALL.iter().find(|t| t.name == name)
}

/// Project template
pub struct Template {
    /// Template name
    name: &'static str,
    /// Rust version to use in the image
    rust_version: &'static str,
    /// Solana version to use in the image
    solana_version: Option<&'static str>,
    /// `cargo-build-sbf` version (should be preferred over [`Self::solana_version`] when available)
    cargo_build_sbf_version: Option<&'static str>,
    /// Command to run for custom tooling installation (always uses `stable` Rust)
    installation_command: Option<&'static str>,
    /// Initial build command to run in order to cache dependencies (has network access)
    initial_build_command: &'static str,
    /// Program directory path
    program_dir: &'static Path,
    // TODO: Maybe use `&'static str` for the following 2 paths as well because target images use
    // Linux, and Rust's default path normalization may cause unexpected paths to be passed in on
    // Windows.
    /// Program binary directory path (build output)
    binary_dir: &'static Path,
    /// Program IDL directory path (build output)
    idl_dir: Option<&'static Path>,
    /// Build the program.
    ///
    /// This method should **not** return an error for compiler errors. Everything else, such as,
    /// `fs` errors, are classified as unexpected errors, and therefore should return an error.
    build: Build,
}

impl Template {
    /// Get the template name.
    pub fn name(&self) -> &str {
        self.name
    }

    /// Get program directory path.
    pub fn program_dir(&self) -> &Path {
        self.program_dir
    }

    /// Get program binary directory path (build output).
    pub fn binary_dir(&self) -> &Path {
        self.binary_dir
    }

    /// Get the program IDL directory path (build output).
    pub fn idl_dir(&self) -> Option<&Path> {
        self.idl_dir
    }

    /// Get the program build processor.
    pub fn build(&self) -> Build {
        self.build
    }

    /// Get the build args to pass to the program build image.
    pub fn image_build_args(&self) -> Vec<String> {
        let mut image_build_args = vec![
            format!("TEMPLATE={}", self.name),
            format!("RUST_VERSION={}", self.rust_version),
            format!("INITIAL_BUILD_COMMAND={}", self.initial_build_command),
            format!("BINARY_DIR={}", self.binary_dir.display()),
        ];
        if let Some(solana_version) = &self.solana_version {
            image_build_args.push(format!("SOLANA_VERSION={solana_version}"));
        };
        if let Some(cargo_build_sbf_version) = &self.cargo_build_sbf_version {
            image_build_args.push(format!("CARGO_BUILD_SBF_VERSION={cargo_build_sbf_version}"));
        };
        if let Some(installation_command) = &self.installation_command {
            image_build_args.push(format!("INSTALLATION_COMMAND={installation_command}"));
        };
        if let Some(idl_dir) = self.idl_dir {
            image_build_args.push(format!("IDL_DIR={}", idl_dir.display()));
        };

        image_build_args
    }

    /// Get whether the given cargo files matches the template.
    pub fn matches(&self, manifest: &str, lock: &str) -> Result<bool> {
        // TODO: Cache
        let template_dir = Path::new("templates").join(self.name);
        let manifest_path = template_dir.join(self.program_dir).join("Cargo.toml");
        let actual_manifest = fs::read_to_string(manifest_path)?;

        let lock_path = template_dir.join("Cargo.lock");
        let actual_lock = fs::read_to_string(lock_path)?;

        Ok(manifest == actual_manifest && lock == actual_lock)
    }
}

impl Default for &Template {
    fn default() -> Self {
        let legacy = Legacy::template();
        get_all_templates()
            .iter()
            .find(|t| t.name == legacy.name)
            .expect("Legacy template must exist")
    }
}

/// Program build processor
type Build = fn(args: &[String]) -> Result<ExitStatus>;
