use std::{panic, str::FromStr};

use solana_extra_wasm::program::spl_token;
use solana_playground_utils_wasm::js::PgTerminal;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;

use crate::{
    clap::get_clap,
    cli::{process_command, BulkSigners, CommandName},
    config::get_config,
    constants::*,
};

#[wasm_bindgen(js_name = "runSplToken")]
pub fn run_spl_token(arg: &str, endpoint: String, commitment: String, keypair_bytes: Vec<u8>) {
    panic::set_hook(Box::new(console_error_panic_hook::hook));

    let args = arg.split_ascii_whitespace().collect::<Vec<&str>>();

    let default_decimals = format!("{}", spl_token::native_mint::DECIMALS);
    let default_program_id = spl_token::id().to_string();

    let match_result = get_clap(
        COMMAND_NAME,
        COMMAND_DESC,
        COMMAND_VERSION,
        &default_decimals,
        &default_program_id,
    )
    .try_get_matches_from(args);

    match match_result {
        Ok(matches) => spawn_local(async move {
            let maybe_matches_subcommand = matches.subcommand();
            let (sub_command, sub_matches) = maybe_matches_subcommand.unwrap();
            let sub_command = CommandName::from_str(sub_command).unwrap();

            let wallet_manager = None;
            let bulk_signers: BulkSigners = Vec::new();
            let config = get_config(sub_matches, &endpoint, &commitment, &keypair_bytes);

            let process_result = process_command(
                sub_command,
                sub_matches,
                config,
                wallet_manager,
                bulk_signers,
            )
            .await;
            let output = match process_result {
                Ok(output) => {
                    format!("{}", output)
                }
                Err(e) => format!("Process error: {}", e.to_string()),
            };

            // Log output
            PgTerminal::log_wasm(&output);
            // Enable terminal
            PgTerminal::enable();
        }),
        Err(e) => {
            // Help or error
            PgTerminal::log_wasm(&format!("{}", e.to_string()));
            // Enable terminal
            PgTerminal::enable();
        }
    };
}
