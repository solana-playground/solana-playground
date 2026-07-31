use std::{
    path::{Path, PathBuf},
    process::{Output, Stdio},
    time::Duration,
};

use anyhow::{anyhow, Result};
use tokio::{process::Command, time::timeout};
use uuid::Uuid;

/// Sandbox manager
#[derive(Debug, Default)]
pub struct Sandbox<'a> {
    /// Configuration
    cfg: Config,
    /// Actions to run sequentially
    actions: Vec<Action<'a>>,
}

impl<'a> Sandbox<'a> {
    /// Create a new [`Sandbox`] instance.
    pub fn new() -> Self {
        Self::default()
    }

    /// Set the timeout limit for the overall process.
    pub fn timeout(mut self, timeout: u64) -> Self {
        self.cfg.timeout.replace(timeout);
        self
    }

    /// Set the Docker image.
    pub fn image(mut self, image: impl ToString) -> Self {
        self.cfg.image.replace(image.to_string());
        self
    }

    /// Set the Docker image user (inside the container).
    // TODO: Make it default to what the image sets `USER` to (Docker defaults to `root`).
    pub fn user(mut self, user: impl ToString) -> Self {
        self.cfg.user.replace(user.to_string());
        self
    }

    /// Set the CPU (cores) limit.
    pub fn cpu_limit(mut self, cpu_limit: usize) -> Self {
        self.cfg.cpu_limit.replace(cpu_limit);
        self
    }

    /// Set the memory limit.
    pub fn memory_limit(mut self, memory_limit: usize) -> Self {
        self.cfg.memory_limit.replace(memory_limit);
        self
    }

    /// Set the process (PIDs) limit.
    pub fn process_limit(mut self, process_limit: usize) -> Self {
        self.cfg.process_limit.replace(process_limit);
        self
    }

    /// Command to run in a sandboxed environment.
    pub fn command(mut self, cmd: &'a Command) -> Self {
        self.actions.push(Action::Run(cmd));
        self
    }

    /// Copy the files from or to the container.
    ///
    /// Unlike Docker, relative paths default to the one set by the image `WORKDIR`.
    ///
    /// # Arguments
    ///
    /// Regular paths with container being special-cased as: `container:<path>`.
    pub fn copy<P1, P2>(mut self, src: P1, dst: P2) -> Self
    where
        P1: AsRef<Path>,
        P2: AsRef<Path>,
    {
        self.actions.push(Action::Copy(
            src.as_ref().to_path_buf(),
            dst.as_ref().to_path_buf(),
        ));
        self
    }

    /// Start the sandboxed process.
    pub async fn run(self) -> Result<Output> {
        const NAME_PREFIX: &str = concat!(env!("CARGO_PKG_NAME"), "-sandbox");
        let container = format!("{NAME_PREFIX}-{}", Uuid::new_v4());

        // Run command(s) in a container
        let fut = async {
            let mut cmd = Command::new("docker");
            cmd.arg("run")
                .arg("--name")
                .arg(&container)
                .arg("--detach")
                .arg("--rm")
                .arg("--cap-drop=ALL")
                .arg("--memory-swap=-1")
                // TODO: Allow networking (customizable)
                // TODO: Allow creating a new network with only specified URLs whitelisted (e.g. npmjs.com)?
                .arg("--network=none")
                .arg("--oom-score-adj=1000") // Make the container easily killable when OOM
                .arg("--security-opt=no-new-privileges");

            if let Some(user) = &self.cfg.user {
                cmd.arg("--user");
                cmd.arg(user);
            }
            if let Some(cpu) = self.cfg.cpu_limit {
                cmd.arg("--cpus");
                cmd.arg(cpu.to_string());
            }
            if let Some(mem) = self.cfg.memory_limit {
                cmd.arg("--memory");
                cmd.arg(format!("{mem}b"));
            }
            if let Some(pids) = self.cfg.process_limit {
                cmd.arg("--pids-limit");
                cmd.arg(pids.to_string());
            }

            match &self.cfg.image {
                Some(image) => cmd.arg(image),
                _ => return Err(anyhow!("Image not specified")),
            };

            cmd.args(["sh", "-lc", "sleep infinity"]);
            run_cmd(&mut cmd).await?;

            let mut all_output = Output {
                status: Default::default(),
                stderr: Default::default(),
                stdout: Default::default(),
            };
            for action in &self.actions {
                match action {
                    Action::Copy(src, dst) => {
                        // `docker cp` does not respect current workdir and assumes relative paths
                        // to be relative to `/`. As a workaround, get the current dir from the
                        // running container and make the path absolute.
                        //
                        // TODO: Only run when there is a relative container path
                        let output = Command::new("docker")
                            .arg("exec")
                            .arg(&container)
                            .arg("pwd")
                            .output()
                            .await?;
                        if !output.status.success() {
                            return Err(anyhow!("Failed to get Docker WORKDIR"));
                        }

                        let workdir = str::from_utf8(&output.stdout)
                            .map(|x| x.trim())
                            .map(Path::new)?;
                        let src = Action::copy_path(src, &container, workdir)?;
                        let dst = Action::copy_path(dst, &container, workdir)?;
                        run_cmd(Command::new("docker").arg("cp").arg(src).arg(dst)).await?;
                    }
                    Action::Run(cmd) => {
                        let cmd = cmd.as_std();
                        let output = Command::new("docker")
                            .arg("exec")
                            .arg(&container)
                            .arg(cmd.get_program())
                            .args(cmd.get_args())
                            .env_clear()
                            .envs(cmd.get_envs().filter_map(|(k, v)| v.map(|v| (k, v))))
                            .output()
                            .await?;
                        all_output.status = output.status;
                        all_output.stderr.extend_from_slice(&output.stderr);
                        all_output.stdout.extend_from_slice(&output.stdout);
                        if !all_output.status.success() {
                            break;
                        }
                    }
                }
            }

            Ok(all_output)
        };

        // Wait for completion
        let result = match self.cfg.timeout {
            Some(to) => match timeout(Duration::from_secs(to), fut).await {
                Ok(res) => res,
                Err(_) => Err(anyhow!("Timed out")),
            },
            _ => fut.await,
        };

        // Cleanup container (killing is enough for cleanup because of `--rm` during creation)
        run_cmd(Command::new("docker").arg("kill").arg(&container))
            .await
            .ok();

        result
    }
}

/// Sandbox configuration
#[derive(Debug, Default)]
struct Config {
    /// Timeout limit
    timeout: Option<u64>,
    /// Docker image
    image: Option<String>,
    /// Docker image user
    user: Option<String>,
    /// CPU (cores) limit
    cpu_limit: Option<usize>,
    /// Memory limit (in bytes)
    memory_limit: Option<usize>,
    /// Process (PIDs) limit
    process_limit: Option<usize>,
    // TODO: Storage limit
}

/// Sandbox action
#[derive(Debug)]
enum Action<'a> {
    /// Run a command
    Run(&'a Command),
    /// Copy from or to the container
    Copy(PathBuf, PathBuf),
}

impl Action<'_> {
    /// Convert custom `container:*` syntax to the one Docker expects with relative path support.
    fn copy_path(path: &Path, container: &str, workdir: &Path) -> Result<PathBuf> {
        // TODO: Something more idiomatic
        path.to_str()
            .ok_or_else(|| anyhow!("Invalid path: {path:?}"))
            .map(|p| {
                if p.starts_with("container:/") {
                    p.replacen("container", container, 1)
                } else if p.starts_with("container:") {
                    p.replacen(
                        "container:",
                        &format!("{container}:{}/", workdir.display()),
                        1,
                    )
                } else {
                    p.to_owned()
                }
            })
            .map(PathBuf::from)
    }
}

/// Run a command and error if it fails.
async fn run_cmd(cmd: &mut Command) -> Result<()> {
    let status = cmd
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .await?;
    if !status.success() {
        let cmd = cmd.as_std();
        return Err(anyhow!(
            "Failed to run `{:?} {:?}",
            cmd.get_program(),
            cmd.get_args()
        ));
    }

    Ok(())
}
