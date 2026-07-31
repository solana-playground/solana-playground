use anyhow::{anyhow, Result};
use tokio::{fs, process::Command};

/// Images directory path
const IMAGES_DIR: &str = "images";

/// Setup the server.
pub async fn setup() -> Result<()> {
    build_images().await?;
    Ok(())
}

/// Build Docker images.
async fn build_images() -> Result<()> {
    let images = {
        let mut dir = fs::read_dir(IMAGES_DIR).await?;
        let mut images = vec![];
        while let Some(entry) = dir.next_entry().await? {
            let path = entry.path();
            let name = entry
                .file_name()
                .to_str()
                .map(|name| name.trim_start_matches("Dockerfile."))
                .map(|name| format!("solpg-server-sandbox-{name}"))
                .ok_or_else(|| anyhow!("Invalid file name: {path:?}"))?;
            images.push((name, path))
        }
        images
    };

    for (name, path) in images {
        let status = Command::new("docker")
            .arg("build")
            .arg("--file")
            .arg(&path)
            .arg("--tag")
            .arg(&name)
            .arg(".")
            .status()
            .await?;
        if !status.success() {
            return Err(anyhow!("Failed to build image: `{name}`"));
        }
    }

    Ok(())
}
