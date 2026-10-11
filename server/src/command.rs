#![allow(async_fn_in_trait)]

use std::process::{ExitStatus, Stdio};

use anyhow::{anyhow, Result};
use tokio::io::AsyncWriteExt;

use crate::log::{debug, enabled_debug};

/// Async command helpers
pub trait AsyncCommand {
    /// Run a command and error if it fails.
    ///
    /// The output is silent unless [`crate::log::Level::DEBUG`] is enabled.
    async fn run(&mut self) -> Result<()>;

    /// Run a command and get its output from `stdout` (trimmed).
    ///
    /// If the command fails, an error is returned.
    async fn output_stdout(&mut self) -> Result<String>;

    /// Run a command that accepts `stdin` input.
    ///
    /// The output is silent unless [`crate::log::Level::DEBUG`] is enabled.
    ///
    /// If the command fails, an error is returned.
    async fn input(&mut self, input: &[u8]) -> Result<()>;
}

impl AsyncCommand for tokio::process::Command {
    async fn run(&mut self) -> Result<()> {
        if !enabled_debug!() {
            self.stdout(Stdio::null()).stderr(Stdio::null());
        }

        let status = self.status().await?;
        handle_error(self.as_std(), status)
    }

    async fn output_stdout(&mut self) -> Result<String> {
        let output = self.output().await?;
        if enabled_debug!() && !output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stderr);
            let stderr = String::from_utf8_lossy(&output.stderr);
            if !stdout.is_empty() || !stderr.is_empty() {
                debug!("{stdout}{stderr}");
            }
        }

        handle_error(self.as_std(), output.status)?;
        str::from_utf8(&output.stdout)
            .map(|s| s.trim())
            .map(ToOwned::to_owned)
            .map_err(Into::into)
    }

    async fn input(&mut self, input: &[u8]) -> Result<()> {
        if !enabled_debug!() {
            self.stdout(Stdio::null()).stderr(Stdio::null());
        }

        let mut child = self.stdin(Stdio::piped()).kill_on_drop(true).spawn()?;
        let mut stdin = child
            .stdin
            .take()
            .ok_or_else(|| anyhow!("Failed to take stdin"))?;
        stdin.write_all(input).await?;

        // Manually drop `stdin` to send `EOF` to `docker build`
        drop(stdin);

        let status = child.wait().await?;
        handle_error(self.as_std(), status)
    }
}

/// Return an error if command did not complete successfully.
fn handle_error(cmd: &std::process::Command, status: ExitStatus) -> Result<()> {
    if !status.success() {
        return Err(anyhow!(
            "Failed to run {:?} {:?}",
            cmd.get_program(),
            cmd.get_args()
        ));
    }

    Ok(())
}
