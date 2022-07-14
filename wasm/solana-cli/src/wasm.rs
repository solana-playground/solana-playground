use std::{collections::HashMap, panic, sync::Arc, time::Duration};

use clap::ArgMatches;
use solana_clap_v3_utils_wasm::{
    input_validators::normalize_to_url_if_moniker, keypair::CliSigners,
};
use solana_cli_config_wasm::{Config, ConfigInput};
use solana_cli_output_wasm::cli_output::{get_name_value_or, OutputFormat};
use solana_client_wasm::utils::rpc_config::RpcSendTransactionConfig;
use solana_extra_wasm::transaction_status::UiTransactionEncoding;
use solana_playground_utils_wasm::js::{PgConnection, PgTerminal};
use solana_remote_wallet::remote_wallet::RemoteWalletManager;
use solana_sdk::signature::Keypair;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;

use crate::{
    clap::get_clap,
    cli::{parse_command, process_command, CliCommandInfo, CliConfig},
};

#[wasm_bindgen(js_name = "runSolana")]
pub fn run_solana(arg: &str, endpoint: &str, commitment: &str, keypair_bytes: &[u8]) {
    panic::set_hook(Box::new(console_error_panic_hook::hook));

    let args = arg.split_ascii_whitespace().collect::<Vec<&str>>();

    let match_result = get_clap("solana-cli", "Blockchain, Rebuilt for Scale", "1.11.0")
        .try_get_matches_from(args);
    match match_result {
        Ok(matches) => {
            if parse_settings(&matches, endpoint, commitment) {
                let mut wallet_manager = None;
                let parse_result = parse_args(
                    &matches,
                    &mut wallet_manager,
                    endpoint,
                    commitment,
                    keypair_bytes,
                );

                spawn_local(async {
                    let output = match parse_result {
                        Ok((mut config, signers)) => {
                            config.signers = signers.iter().map(|s| s.as_ref()).collect();

                            let process_result = process_command(&config).await;
                            match process_result {
                                Ok(output) => {
                                    format!("{}", output)
                                }
                                Err(e) => format!("Process error: {}", e),
                            }
                        }
                        Err(e) => format!("Parse error: {}", e.to_string()),
                    };

                    // Log output
                    PgTerminal::log_wasm(&output);
                    // Enable terminal
                    PgTerminal::enable();
                })
            } else {
                // Config command
                // Enable terminal
                PgTerminal::enable();
            }
        }
        Err(e) => {
            // Help or error
            PgTerminal::log_wasm(&e.to_string());
            // Enable terminal
            PgTerminal::enable();
        }
    };
}

fn parse_settings(matches: &ArgMatches, endpoint: &str, commitment: &str) -> bool {
    match matches.subcommand() {
        Some(("config", matches)) => {
            let mut config = Config::new(endpoint, commitment);

            match matches.subcommand() {
                Some(("get", subcommand_matches)) => {
                    let (url_setting_type, json_rpc_url) =
                        ConfigInput::compute_json_rpc_url_setting("", &config.json_rpc_url);
                    let (ws_setting_type, websocket_url) =
                        ConfigInput::compute_websocket_url_setting(
                            "",
                            &config.websocket_url,
                            "",
                            &config.json_rpc_url,
                        );
                    // let (keypair_setting_type, keypair_path) =
                    //     ConfigInput::compute_keypair_path_setting("", &config.keypair_path);
                    let (commitment_setting_type, commitment) =
                        ConfigInput::compute_commitment_config("", &config.commitment);

                    if let Some(field) = subcommand_matches.value_of("specific_setting") {
                        let (field_name, value, setting_type) = match field {
                            "json_rpc_url" => ("RPC URL", json_rpc_url, url_setting_type),
                            "websocket_url" => ("WebSocket URL", websocket_url, ws_setting_type),
                            // "keypair" => ("Key Path", keypair_path, keypair_setting_type),
                            "commitment" => (
                                "Commitment",
                                commitment.commitment.to_string(),
                                commitment_setting_type,
                            ),
                            _ => unreachable!(),
                        };
                        PgTerminal::log_wasm(&format!(
                            "{}",
                            get_name_value_or(&format!("{}:", field_name), &value, setting_type),
                        ));
                    } else {
                        // Appending log messages because of terminal issue with unnecessary
                        // prompt messages in browser
                        let mut msg = String::new();
                        // PgTerminal::log_wasm("{}", get_name_value("Config File:", config_file));
                        let rpc_msg = format!(
                            "{}\n",
                            get_name_value_or("RPC URL:", &json_rpc_url, url_setting_type),
                        );
                        let ws_msg = format!(
                            "{}\n",
                            get_name_value_or("WebSocket URL:", &websocket_url, ws_setting_type),
                        );
                        // PgTerminal::log_wasm(
                        //     "{}",
                        //     get_name_value_or("Keypair Path:", &keypair_path, keypair_setting_type)
                        // );
                        let commitment_msg = format!(
                            "{}",
                            get_name_value_or(
                                "Commitment:",
                                &commitment.commitment.to_string(),
                                commitment_setting_type,
                            ),
                        );

                        msg.push_str(&rpc_msg);
                        msg.push_str(&ws_msg);
                        msg.push_str(&commitment_msg);

                        PgTerminal::log_wasm(&msg);
                    }
                }
                Some(("set", subcommand_matches)) => {
                    if let Some(url) = subcommand_matches.value_of("json_rpc_url") {
                        config.json_rpc_url = normalize_to_url_if_moniker(url);
                        // Revert to a computed `websocket_url` value when `json_rpc_url` is
                        // changed
                        config.websocket_url = "".to_string();
                    }
                    if let Some(url) = subcommand_matches.value_of("websocket_url") {
                        config.websocket_url = url.to_string();
                    }
                    if let Some(keypair) = subcommand_matches.value_of("keypair") {
                        config.keypair_path = keypair.to_string();
                    }
                    if let Some(commitment) = subcommand_matches.value_of("commitment") {
                        config.commitment = commitment.to_string();
                    }

                    // Config is coming from JS
                    PgConnection::update_wasm(&config.json_rpc_url, &config.commitment);

                    let (url_setting_type, json_rpc_url) =
                        ConfigInput::compute_json_rpc_url_setting("", &config.json_rpc_url);
                    let (ws_setting_type, websocket_url) =
                        ConfigInput::compute_websocket_url_setting(
                            "",
                            &config.websocket_url,
                            "",
                            &config.json_rpc_url,
                        );
                    // let (keypair_setting_type, keypair_path) =
                    //     ConfigInput::compute_keypair_path_setting("", &config.keypair_path);
                    let (commitment_setting_type, commitment) =
                        ConfigInput::compute_commitment_config("", &config.commitment);

                    let mut msg = String::new();
                    // PgTerminal::log_wasm(get_name_value("Config File:", config_file));
                    let rpc_msg = format!(
                        "{}\n",
                        get_name_value_or("RPC URL:", &json_rpc_url, url_setting_type),
                    );
                    let ws_msg = format!(
                        "{}\n",
                        get_name_value_or("WebSocket URL:", &websocket_url, ws_setting_type),
                    );
                    // PgTerminal::log_wasm(
                    //     "{}",
                    //     get_name_value_or("Keypair Path:", &keypair_path, keypair_setting_type)
                    // );
                    let commitment_msg = format!(
                        "{}",
                        get_name_value_or(
                            "Commitment:",
                            &commitment.commitment.to_string(),
                            commitment_setting_type,
                        ),
                    );

                    msg.push_str(&rpc_msg);
                    msg.push_str(&ws_msg);
                    msg.push_str(&commitment_msg);

                    PgTerminal::log_wasm(&msg);
                }
                // Some(("import-address-labels", subcommand_matches)) => {
                //     let filename = value_t_or_exit!(subcommand_matches, "filename", PathBuf);
                //     config.import_address_labels(&filename)?;
                //     config.save(config_file)?;
                //     PgTerminal::log_wasm("Address labels imported from {:?}", filename);
                // }
                // Some(("export-address-labels", subcommand_matches)) => {
                //     let filename = value_t_or_exit!(subcommand_matches, "filename", PathBuf);
                //     config.export_address_labels(&filename)?;
                //     PgTerminal::log_wasm("Address labels exported to {:?}", filename);
                // }
                _ => unreachable!(),
            }

            false
        }
        Some(_) => true,
        None => true,
    }
}

fn parse_args<'a>(
    matches: &ArgMatches,
    wallet_manager: &mut Option<Arc<RemoteWalletManager>>,
    endpoint: &str,
    commitment: &str,
    keypair_bytes: &[u8],
) -> Result<(CliConfig<'a>, CliSigners), Box<dyn std::error::Error>> {
    let config = Config::new(endpoint, commitment);

    let (_, json_rpc_url) = ConfigInput::compute_json_rpc_url_setting(
        matches.value_of("json_rpc_url").unwrap_or(""),
        &config.json_rpc_url,
    );

    let rpc_timeout = matches.value_of_t_or_exit("rpc_timeout");
    let rpc_timeout = Duration::from_secs(rpc_timeout);

    let confirm_transaction_initial_timeout =
        matches.value_of_t_or_exit("confirm_transaction_initial_timeout");
    let confirm_transaction_initial_timeout =
        Duration::from_secs(confirm_transaction_initial_timeout);

    let (_, websocket_url) = ConfigInput::compute_websocket_url_setting(
        matches.value_of("websocket_url").unwrap_or(""),
        &config.websocket_url,
        matches.value_of("json_rpc_url").unwrap_or(""),
        &config.json_rpc_url,
    );
    let default_signer_arg_name = "keypair".to_string();
    let (_, default_signer_path) = ConfigInput::compute_keypair_path_setting(
        matches.value_of(&default_signer_arg_name).unwrap_or(""),
        &config.keypair_path,
    );

    // TODO:
    // let default_signer = DefaultSigner::new(default_signer_arg_name, &default_signer_path);
    let default_signer = Box::new(Keypair::from_bytes(keypair_bytes).unwrap());

    let CliCommandInfo { command, signers } =
        parse_command(matches, default_signer, wallet_manager)?;

    let verbose = matches.is_present("verbose");
    let output_format = OutputFormat::from_matches(matches, "output_format", verbose);

    let (_, commitment_config) = ConfigInput::compute_commitment_config(
        matches.value_of("commitment").unwrap_or(""),
        &config.commitment,
    );

    let address_labels = if matches.is_present("no_address_labels") {
        HashMap::new()
    } else {
        config.address_labels
    };

    Ok((
        CliConfig {
            command,
            json_rpc_url,
            websocket_url,
            signers: vec![],
            keypair_path: default_signer_path,
            // rpc_client: None,
            rpc_timeout,
            verbose,
            output_format,
            commitment_config,
            send_transaction_config: RpcSendTransactionConfig {
                preflight_commitment: Some(commitment_config.commitment),
                encoding: Some(UiTransactionEncoding::Base64),
                ..RpcSendTransactionConfig::default()
            },
            confirm_transaction_initial_timeout,
            address_labels,
        },
        signers,
    ))
}
