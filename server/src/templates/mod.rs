mod anchor;
mod legacy;

use std::{fs, path::Path, process::ExitStatus, sync::LazyLock};

use anchor::*;
use anyhow::{anyhow, Result};
use legacy::*;

use crate::utils::Files;

/// All templates
static ALL: LazyLock<Vec<Template>> =
    LazyLock::new(|| vec![Legacy::template(), Anchor1_1_2::template()]);

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
    /// Solana version to use in the image
    solana_version: &'static str,
    /// Rust version to use in the image
    rust_version: &'static str,
    /// Command to run for custom tooling installation (always uses `stable` Rust)
    installation_command: Option<&'static str>,
    /// Initial build command to run when there is network access to cache dependencies
    initial_build_command: &'static str,
    /// Program directory path
    program_path: &'static Path,
    // TODO: Maybe use `&'static str` for the following 2 paths as well because target images use
    // Linux, and Rust's default path normalization may cause unexpected paths to be passed in on
    // Windows.
    /// Program binary directory path (build output)
    binary_path: &'static Path,
    /// Program IDL directory path (build output)
    idl_path: Option<&'static Path>,
    /// Program build processor
    processor: Processor,
}

/// Program build processor
type Processor = Box<dyn Process + Sync + Send>;

impl Template {
    /// Template name.
    pub fn name(&self) -> &str {
        self.name
    }

    /// Program directory path
    pub fn program_path(&self) -> &Path {
        self.program_path
    }

    /// Program binary directory path (build output)
    pub fn binary_path(&self) -> &Path {
        self.binary_path
    }

    /// Program IDL directory path (build output)
    pub fn idl_path(&self) -> Option<&Path> {
        self.idl_path
    }

    /// Program build processor
    pub fn processor(&self) -> &Processor {
        &self.processor
    }

    /// Build args to pass to the program build image.
    pub fn image_build_args(&self) -> Vec<String> {
        let mut image_build_args = vec![
            format!("TEMPLATE={}", self.name),
            format!("SOLANA_VERSION={}", self.solana_version),
            format!("RUST_VERSION={}", self.rust_version),
            format!("INITIAL_BUILD_COMMAND={}", self.initial_build_command),
            format!("BINARY_PATH={}", self.binary_path.display()),
        ];
        if let Some(installation_command) = &self.installation_command {
            image_build_args.push(format!("INSTALLATION_COMMAND={installation_command}"));
        };
        if let Some(idl_path) = self.idl_path {
            image_build_args.push(format!("IDL_PATH={}", idl_path.display()));
        };

        image_build_args
    }

    /// Pick the template from a project's `cargo` files, the default one when
    /// there are none.
    ///
    /// The manifest selects it; a new Anchor project sends one with no
    /// `Cargo.lock`, so selection must work from the manifest alone.
    pub fn find(files: &Files) -> Result<&'static Template> {
        let manifest = files.iter().find(|(p, _)| p == "Cargo.toml");
        let lock = files.iter().find(|(p, _)| p == "Cargo.lock");
        match (manifest, lock) {
            (None, None) => Ok(Default::default()),
            (None, Some(_)) => Err(anyhow!("Missing `Cargo.toml`")),
            (Some((_, manifest)), lock) => {
                let lock = lock.map(|(_, content)| content.as_str());
                for template in get_all_templates() {
                    if template.matches(manifest, lock)? {
                        return Ok(template);
                    }
                }
                Err(anyhow!(
                    "The `cargo` files match no build template: the dependency set \
                    is fixed by the build images. Revert `Cargo.toml` to restore \
                    builds and intellisense"
                ))
            }
        }
    }

    /// Get whether the given cargo files matches the template.
    ///
    /// The lock is optional to support projects that send a manifest without
    /// one: a new Anchor project no longer bundles a `Cargo.lock`, so the LSP
    /// `open` (and the build) must select a template from the manifest alone.
    /// That is sound because the manifest is the discriminator: it is distinct
    /// per template and selects the build image, which fixes the exact
    /// versions. A lock, when supplied, is byte-checked too.
    pub fn matches(&self, manifest: &str, lock: Option<&str>) -> Result<bool> {
        // TODO: Cache
        let template_dir = Path::new("templates").join(self.name);
        let manifest_path = template_dir.join(self.program_path).join("Cargo.toml");
        let actual_manifest = fs::read_to_string(manifest_path)?;
        if manifest != actual_manifest {
            return Ok(false);
        }

        let Some(lock) = lock else { return Ok(true) };
        let lock_path = template_dir.join("Cargo.lock");
        let actual_lock = fs::read_to_string(lock_path)?;
        Ok(lock == actual_lock)
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

/// Program build process
pub trait Process {
    /// Build the program.
    ///
    /// This method should **not** return an error for compiler errors. Everything else, such as,
    /// `fs` errors, are classified as unexpected errors, and therefore should return an error.
    fn build(&self, args: &[String]) -> Result<ExitStatus>;
}
