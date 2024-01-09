use clap::Parser;
use solana_playground_utils_wasm::js::PgTerminal;
use wasm_bindgen::prelude::*;

use crate::commands::idl::{process_idl, IdlCommand};

#[derive(Parser)]
#[clap(version, about)]
enum Cli {
    /// Commands for interacting with interface definitions
    Idl {
        #[clap(subcommand)]
        subcmd: IdlCommand,
    },
}

pub type CliResult<T = ()> = anyhow::Result<T>;

#[wasm_bindgen(js_name = runAnchor)]
pub async fn run_anchor(cmd: &str) {
    std::panic::set_hook(Box::new(console_error_panic_hook::hook));

    let args = cmd.split_ascii_whitespace().collect::<Vec<&str>>();

    match Cli::try_parse_from(args) {
        Ok(cli) => match cli {
            Cli::Idl { subcmd } => {
                if let Err(e) = process_idl(subcmd).await {
                    PgTerminal::log_wasm(&format!("Process error: {e}"))
                }
            }
        },
        Err(e) => PgTerminal::log_wasm(&e.to_string()),
    }
}
