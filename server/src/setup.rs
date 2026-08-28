use anyhow::{anyhow, Result};
use solpg_server::{templates::get_all_templates, utils::get_image_name};
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
                .ok_or_else(|| anyhow!("Invalid file name: {path:?}"))
                .map(|name| name.trim_start_matches("Dockerfile.").to_owned())?;
            match name.as_str() {
                "program" => {
                    for template in get_all_templates() {
                        let name = format!("{name}-{}", template.name());
                        let args = template.image_build_args();
                        images.push((path.clone(), name, args));
                    }
                }
                _ => {
                    images.push((path, name, vec![]));
                }
            }
        }
        images
    };

    for (path, name, args) in images {
        let name = get_image_name(&name);
        let mut cmd = Command::new("docker");
        cmd.arg("build")
            .arg("--file")
            .arg(path)
            .arg("--tag")
            .arg(&name);
        for arg in args {
            cmd.arg("--build-arg").arg(arg);
        }

        let status = cmd.arg(".").status().await?;
        if !status.success() {
            return Err(anyhow!("Failed to build image: `{name}`"));
        }
    }

    Ok(())
}
