mod anchor;

use std::{path::Path, process::ExitStatus, sync::LazyLock};

use anchor::*;

/// All templates
static ALL: LazyLock<Vec<Template>> = LazyLock::new(|| vec![Anchor0_29_0::template()]);

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
}

/// Program build process
pub trait Process {
    /// Build the program.
    ///
    /// This method should **not** return an error for compiler errors. Everything else, such as,
    /// `fs` errors, are classified as unexpected errors, and therefore should return an error.
    fn build(&self, args: &[String]) -> anyhow::Result<ExitStatus>;
}
