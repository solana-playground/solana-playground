use std::{
    env,
    path::{Path, PathBuf},
};

use anyhow::{anyhow, Result};
use solpg_server::package::{get_node_modules_path, BUILD_DIR, PACKAGES_DIR};
use tokio::{fs, process::Command};

#[tokio::main]
async fn main() -> Result<()> {
    let args = Args::from_env()?;
    let name = &args.name;
    let out = &args.out;

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
        .arg(
            out.to_str()
                .ok_or_else(|| anyhow!("Invalid out path: {out:?}"))?
                .trim_start_matches(&format!("{PACKAGES_DIR}/{BUILD_DIR}/")),
        )
        .output()
        .await?;

    if !output.status.success() {
        return Err(anyhow!(
            "Failed to bundle package: `{name}`: {}",
            str::from_utf8(&output.stdout)?
        ));
    }

    Ok(())
}

struct Args {
    name: String,
    out: PathBuf,
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
        let Some(out) = args.next() else {
            return Err(anyhow!("Missing out path"));
        };

        Ok(Self {
            name,
            out: out.into(),
        })
    }
}
