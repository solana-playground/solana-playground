#![allow(async_fn_in_trait)]

use std::process::{ExitStatus, Stdio};

use anyhow::{anyhow, Result};

/// Async command helpers
pub trait AsyncCommand {
    /// Run a command and error if it fails.
    async fn run(&mut self) -> Result<()>;

    /// Run a command in silent mode and error if it fails.
    async fn run_silent(&mut self) -> Result<()>;

    /// Run a command and get its output from `stdout` (trimmed).
    ///
    /// If the command fails, an error is returned.
    async fn output_stdout(&mut self) -> Result<String>;
}

impl AsyncCommand for tokio::process::Command {
    async fn run(&mut self) -> Result<()> {
        let status = self.status().await?;
        handle_error(self.as_std(), status)
    }

    async fn run_silent(&mut self) -> Result<()> {
        self.stdout(Stdio::null()).stderr(Stdio::null()).run().await
    }

    async fn output_stdout(&mut self) -> Result<String> {
        let output = self.output().await?;
        handle_error(self.as_std(), output.status)?;
        str::from_utf8(&output.stdout)
            .map(|s| s.trim())
            .map(ToOwned::to_owned)
            .map_err(Into::into)
    }
}

/// Return an error if command did not complete successfully.
fn handle_error(cmd: &std::process::Command, status: ExitStatus) -> Result<()> {
    if !status.success() {
        return Err(anyhow!(
            "Failed to run `{:?} {:?}",
            cmd.get_program(),
            cmd.get_args()
        ));
    }

    Ok(())
}
