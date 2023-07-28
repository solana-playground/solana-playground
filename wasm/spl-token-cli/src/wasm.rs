use std::{panic, str::FromStr};

use solana_extra_wasm::program::spl_token;
use solana_playground_utils_wasm::js::{PgSettings, PgTerminal, PgWallet};
use wasm_bindgen::prelude::*;

use crate::{
    clap::get_clap,
    cli::{process_command, BulkSigners, CommandName},
    config::get_config,
    constants::*,
};

#[wasm_bindgen(js_name = "runSplToken")]
pub async fn run_spl_token(cmd: String) {
    panic::set_hook(Box::new(console_error_panic_hook::hook));

    let default_decimals = format!("{}", spl_token::native_mint::DECIMALS);
    let default_program_id = spl_token::id().to_string();

    let args = cmd.split_ascii_whitespace().collect::<Vec<&str>>();

    let match_result = get_clap(
        COMMAND_NAME,
        COMMAND_DESC,
        COMMAND_VERSION,
        &default_decimals,
        &default_program_id,
    )
    .try_get_matches_from(args);

    match match_result {
        Ok(matches) => {
            let maybe_matches_subcommand = matches.subcommand();
            let (sub_command, sub_matches) = maybe_matches_subcommand.unwrap();
            let sub_command = CommandName::from_str(sub_command).unwrap();

            let wallet_manager = None;
            let bulk_signers: BulkSigners = Vec::new();

            let connection_settings = PgSettings::connection();
            let endpoint = connection_settings.endpoint();
            let commitment = connection_settings.commitment();
            let keypair_bytes = PgWallet::keypair_bytes();

            let config = get_config(sub_matches, &endpoint, &commitment, &keypair_bytes);

            let output = process_command(
                sub_command,
                sub_matches,
                config,
                wallet_manager,
                bulk_signers,
            )
            .await
            .unwrap_or_else(|e| format!("Process error: {e}"));

            // Log output
            PgTerminal::log_wasm(&output);
        }
        Err(e) => {
            // Help or error
            PgTerminal::log_wasm(&e.to_string());
        }
    };
}
