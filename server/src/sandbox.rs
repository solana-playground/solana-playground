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
    ///
    /// # Note
    ///
    /// It's recommended to set [the timeout limit] when the process can be cancelled externally.
    /// Not doing so may leave orphan containers.
    ///
    /// [the timeout limit]: Self::timeout_limit
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// Set the Docker image.
    #[must_use]
    pub fn image(mut self, image: impl ToString) -> Self {
        self.cfg.image.replace(image.to_string());
        self
    }

    /// Set the Docker image user (inside the container).
    // TODO: Make it default to what the image sets `USER` to (Docker defaults to `root`).
    #[must_use]
    pub fn user(mut self, user: impl ToString) -> Self {
        self.cfg.user.replace(user.to_string());
        self
    }

    /// Allow networking.
    ///
    /// # Note
    ///
    /// This is dangerous. Only allow if it's absolutely necessary.
    #[must_use]
    pub fn allow_networking(mut self) -> Self {
        self.cfg.allow_networking = true;
        self
    }

    /// Set the limits for the overall process.
    #[must_use]
    pub fn limits(mut self, limits: Limits) -> Self {
        self.cfg.limits = limits;
        self
    }

    /// Set the timeout limit for the overall process.
    #[must_use]
    pub fn timeout_limit(mut self, timeout_limit: u64) -> Self {
        self.cfg.limits.timeout.replace(timeout_limit);
        self
    }

    /// Set the CPU (cores) limit.
    #[must_use]
    pub fn cpu_limit(mut self, cpu_limit: usize) -> Self {
        self.cfg.limits.cpu.replace(cpu_limit);
        self
    }

    /// Set the memory limit.
    #[must_use]
    pub fn memory_limit(mut self, memory_limit: usize) -> Self {
        self.cfg.limits.memory.replace(memory_limit);
        self
    }

    /// Set the process (PIDs) limit.
    #[must_use]
    pub fn process_limit(mut self, process_limit: usize) -> Self {
        self.cfg.limits.process.replace(process_limit);
        self
    }

    /// Set the storage limit.
    ///
    /// # Note
    ///
    /// This only works with the `overlay2` storage driver using `xfs` mounted with the `pquota`
    /// option. Otherwise it may error:
    ///
    /// ```txt
    /// docker: Error response from daemon: --storage-opt is supported only for overlay over xfs with 'pquota' mount option
    /// ```
    ///
    /// Docker documentation mentions that `btrfs` and `zfs` storage drivers are also supported, but
    /// they have additional limitations that make it infeasible to work with.
    ///
    /// `extfs` is still not supported: https://github.com/moby/moby/issues/29364
    #[must_use]
    pub fn storage_limit(mut self, storage_limit: usize) -> Self {
        self.cfg.limits.storage.replace(storage_limit);
        self
    }

    /// Command to run in a sandboxed environment.
    #[must_use]
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
    #[must_use]
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
                // TODO: Allow creating a new network with only specified URLs whitelisted (e.g. npmjs.com)?
                .arg("--oom-score-adj=1000") // Make the container easily killable when OOM
                .arg("--security-opt=no-new-privileges");

            if let Some(user) = &self.cfg.user {
                cmd.arg("--user").arg(user);
            }
            if !self.cfg.allow_networking {
                cmd.arg("--network=none");
            }
            if let Some(cpu) = self.cfg.limits.cpu {
                cmd.arg("--cpus").arg(cpu.to_string());
            }
            if let Some(mem) = self.cfg.limits.memory {
                cmd.arg("--memory").arg(format!("{mem}b"));
            }
            if let Some(pids) = self.cfg.limits.process {
                cmd.arg("--pids-limit").arg(pids.to_string());
            }
            if let Some(storage) = self.cfg.limits.storage {
                cmd.arg("--storage-opt").arg(format!("size={storage}b"));
            }

            match &self.cfg.image {
                Some(image) => cmd.arg(image),
                _ => return Err(anyhow!("Image not specified")),
            };

            cmd.arg("sleep");
            match self.cfg.limits.timeout {
                Some(timeout) => cmd.arg(timeout.to_string()),
                _ => cmd.arg("infinity"),
            };

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
                        let workdir = output_cmd(
                            Command::new("docker")
                                .arg("exec")
                                .arg(&container)
                                .arg("pwd"),
                        )
                        .await
                        .map(PathBuf::from)?;

                        let src = Action::copy_path(src, &container, &workdir)?;
                        let stripped_container_dst = dst
                            .to_str()
                            .ok_or_else(|| anyhow!("Invalid path: {dst:?}"))?
                            .strip_prefix("container:")
                            .map(Path::new);
                        match (&self.cfg.user, stripped_container_dst) {
                            // If transfering to the container, `docker cp` does not set the current
                            // user as the owner. The owner cannot be changed because `CAP_CHOWN` is
                            // removed (by `--cap-drop=ALL`). As a workaround, `docker cp` into a
                            // temp directory and then copy the files to the actual destination
                            // using the current user.
                            (Some(_), Some(stripped_container_dst)) => {
                                // TODO: Get temp dir from the container instead of hardcoding
                                let temp_dst = Path::new("/tmp").join(stripped_container_dst);
                                let dst = Action::copy_path(
                                    &PathBuf::from(format!("container:{}", temp_dst.display())),
                                    &container,
                                    &workdir,
                                )?;
                                run_cmd(Command::new("docker").arg("cp").arg(src).arg(dst)).await?;
                                run_cmd(
                                    Command::new("docker")
                                        .arg("exec")
                                        .arg(&container)
                                        .arg("cp")
                                        .arg("--recursive")
                                        .arg(temp_dst)
                                        .arg(stripped_container_dst),
                                )
                                .await?;
                            }
                            _ => {
                                let dst = Action::copy_path(dst, &container, &workdir)?;
                                run_cmd(Command::new("docker").arg("cp").arg(src).arg(dst)).await?;
                            }
                        }
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
        let result = match self.cfg.limits.timeout {
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
    /// Image name
    image: Option<String>,
    /// Image user
    user: Option<String>,
    /// Whether to allow networking
    allow_networking: bool,
    /// Container limits
    limits: Limits,
}

/// Sandbox limits
#[derive(Copy, Clone, Debug, Default)]
pub struct Limits {
    /// Timeout limit
    pub timeout: Option<u64>,
    /// CPU (cores) limit
    pub cpu: Option<usize>,
    /// Memory limit (in bytes)
    pub memory: Option<usize>,
    /// Process (PIDs) limit
    pub process: Option<usize>,
    /// Storage limit
    pub storage: Option<usize>,
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

/// Run a command and get its output from `stdout` (trimmed).
///
/// If the command fails, an error is returned.
async fn output_cmd(cmd: &mut Command) -> Result<String> {
    let output = cmd.output().await?;
    if !output.status.success() {
        let cmd = cmd.as_std();
        return Err(anyhow!(
            "Failed to run `{:?} {:?}",
            cmd.get_program(),
            cmd.get_args()
        ));
    }

    str::from_utf8(&output.stdout)
        .map(|s| s.trim())
        .map(ToOwned::to_owned)
        .map_err(Into::into)
}
