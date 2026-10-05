// TODO: All packages and versions from NPM
// TODO: Switch to `pnpm` without shared cache (simpler transition if we decide to use shared cache)
// TODO: Use shared cache with `pnpm`? (shared cache is better for speed but worse for security)
// TODO: Check if bundling client-side is feasible with a tool like `esbuild-wasm`?

use std::{
    iter,
    path::{Path, PathBuf},
    sync::LazyLock,
};

use anyhow::{anyhow, Result};
use regex::Regex;

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

/// Package manager executable
pub const PACKAGE_MANAGER: &str = "yarn";

/// Accepted `yarn` subcommands, the first being the default
const SUBCOMMANDS: [&str; 4] = ["install", "add", "remove", "upgrade"];

/// Options `yarn add` accepts; the other subcommands accept none
const ADD_OPTIONS: [&str; 6] = ["--dev", "-D", "--peer", "-P", "--optional", "-O"];

/// `name[@range]` with an optional scope; rejects every protocol, git, and alias form
static PACKAGE_SPEC_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^(@[a-z0-9][a-z0-9._-]*/)?[a-z0-9][a-z0-9._-]*(@[A-Za-z0-9.^~<>=|*+_-]+)?$")
        .unwrap()
});

/// A `yarn` invocation that passed the allowlist, so only `packages` carries request text
pub struct YarnCommand {
    pub subcommand: &'static str,
    pub options: Vec<&'static str>,
    pub packages: Vec<String>,
}

impl YarnCommand {
    /// Parse `[manager, subcommand, args..]`; no tokens or a bare manager means `install`.
    pub fn parse(tokens: &[String]) -> Result<Self> {
        let args = match tokens {
            [] => tokens,
            [manager, args @ ..] if manager == PACKAGE_MANAGER => args,
            [manager, ..] => return Err(anyhow!("Unsupported package manager: `{manager}`")),
        };
        let (subcommand, args) = match args {
            [] => (SUBCOMMANDS[0], args),
            [subcommand, args @ ..] => (
                SUBCOMMANDS
                    .into_iter()
                    .find(|s| s == subcommand)
                    .ok_or_else(|| anyhow!("Unsupported command: `{subcommand}`"))?,
                args,
            ),
        };
        let allowed_options: &[&'static str] = match subcommand {
            "add" => &ADD_OPTIONS,
            _ => &[],
        };

        let mut options = vec![];
        let mut packages = vec![];
        for arg in args {
            if arg.starts_with('-') {
                let option = allowed_options
                    .iter()
                    .find(|opt| *opt == arg)
                    .ok_or_else(|| anyhow!("Invalid option: `{arg}`"))?;
                options.push(*option);
            } else if PACKAGE_SPEC_REGEX.is_match(arg) {
                packages.push(arg.clone());
            } else {
                return Err(anyhow!("Invalid package: `{arg}`"));
            }
        }

        Ok(Self {
            subcommand,
            options,
            packages,
        })
    }

    /// Arguments after the package manager name, in the order `yarn` accepts them.
    pub fn args(&self) -> impl Iterator<Item = &str> {
        iter::once(self.subcommand)
            .chain(self.options.iter().copied())
            .chain(self.packages.iter().map(String::as_str))
    }
}

/// Get the path to the process output directory.
pub fn get_out_path() -> PathBuf {
    Path::new(PACKAGES_DIR).join(OUT_DIR)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tokens(tokens: &[&str]) -> Vec<String> {
        tokens.iter().map(ToString::to_string).collect()
    }

    fn args(tokens: &[&str]) -> Vec<String> {
        YarnCommand::parse(&self::tokens(tokens))
            .unwrap()
            .args()
            .map(ToOwned::to_owned)
            .collect()
    }

    #[test]
    fn empty_tokens_and_bare_yarn_mean_install() {
        assert_eq!(args(&[]), ["install"]);
        assert_eq!(args(&["yarn"]), ["install"]);
    }

    #[test]
    fn emits_subcommand_then_options_then_packages() {
        assert_eq!(
            args(&[
                "yarn",
                "add",
                "@scope/pkg@^1.2.3",
                "--dev",
                "pkg-name@latest"
            ]),
            ["add", "--dev", "@scope/pkg@^1.2.3", "pkg-name@latest"]
        );
    }

    #[test]
    fn rejects_another_package_manager() {
        assert!(YarnCommand::parse(&tokens(&["npm", "install"])).is_err());
    }

    #[test]
    fn rejects_an_unknown_subcommand() {
        assert!(YarnCommand::parse(&tokens(&["yarn", "run", "pkg"])).is_err());
    }

    #[test]
    fn rejects_an_option_outside_the_subcommand_allowlist() {
        assert!(YarnCommand::parse(&tokens(&["yarn", "remove", "pkg", "--dev"])).is_err());
        assert!(YarnCommand::parse(&tokens(&["yarn", "add", "pkg", "--registry=x"])).is_err());
    }

    #[test]
    fn rejects_package_specs_outside_the_name_and_range_shape() {
        for spec in ["file:pkg", "pkg/sub", ".pkg", "pkg#abc", "Pkg"] {
            assert!(
                YarnCommand::parse(&tokens(&["yarn", "add", spec])).is_err(),
                "accepted `{spec}`"
            );
        }
    }
}
