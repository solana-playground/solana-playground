use clap::{Arg, Command};
use solana_clap_v3_utils_wasm::{
    input_validators::{is_url, is_url_or_moniker},
    keypair::SKIP_SEED_PHRASE_VALIDATION_ARG,
};

use crate::{
    cli::{DEFAULT_CONFIRM_TX_TIMEOUT_SECONDS, DEFAULT_RPC_TIMEOUT_SECONDS},
    commands::{
        cluster_query::ClusterQuerySubCommands, config::ConfigSubCommands,
        feature::FeatureSubCommands, inflation::InflationSubCommands, nonce::NonceSubCommands,
        program::ProgramSubCommands, stake::StakeSubCommands, vote::VoteSubCommands,
        wallet::WalletSubCommands,
    },
};

pub fn get_clap<'a>(name: &str, about: &'a str, version: &'a str) -> Command<'a> {
    Command::new(name)
        .about(about)
        .version(version)
        .subcommand_required(true)
        .arg_required_else_help(true)
        //  // Args
        // .arg({
        //     let arg = Arg::new("config_file")
        //         .short('C')
        //         .long("config")
        //         .value_name("FILEPATH")
        //         .takes_value(true)
        //         .global(true)
        //         .help("Configuration file to use");
        //     // if let Some(ref config_file) = *CONFIG_FILE {
        //     //     arg.default_value(config_file)
        //     // } else {
        //     //     arg
        //     // }
        //     arg
        // })
        .arg(
            Arg::new("json_rpc_url")
                .short('u')
                .long("url")
                .value_name("URL_OR_MONIKER")
                .takes_value(true)
                .global(true)
                .validator(is_url_or_moniker)
                .help(
                    "URL for Solana's JSON RPC or moniker (or their first letter): \
                       [mainnet-beta, testnet, devnet, localhost]",
                ),
        )
        .arg(
            Arg::new("websocket_url")
                .long("ws")
                .value_name("URL")
                .takes_value(true)
                .global(true)
                .validator(is_url)
                .help("WebSocket URL for the solana cluster"),
        )
        // .arg(
        //     Arg::new("keypair")
        //         .short('k')
        //         .long("keypair")
        //         .value_name("KEYPAIR")
        //         .global(true)
        //         .takes_value(true)
        //         .help("Filepath or URL to a keypair"),
        // )
        .arg(
            Arg::new("commitment")
                .long("commitment")
                .takes_value(true)
                .possible_values([
                    "processed",
                    "confirmed",
                    "finalized",
                ])
                .value_name("COMMITMENT_LEVEL")
                .hide_possible_values(true)
                .global(true)
                .help("Return information at the selected commitment level [possible values: processed, confirmed, finalized]"),
        )
        .arg(
            Arg::new("verbose")
                .long("verbose")
                .short('v')
                .global(true)
                .help("Show additional information"),
        )
        .arg(
            Arg::new("no_address_labels")
                .long("no-address-labels")
                .global(true)
                .help("Do not use address labels in the output"),
        )
        .arg(
            Arg::new("output_format")
                .long("output")
                .value_name("FORMAT")
                .global(true)
                .takes_value(true)
                .possible_values(["json", "json-compact"])
                .help("Return information in specified output format"),
        )
        .arg(
            Arg::new(SKIP_SEED_PHRASE_VALIDATION_ARG.name)
                .long(SKIP_SEED_PHRASE_VALIDATION_ARG.long)
                .global(true)
                .help(SKIP_SEED_PHRASE_VALIDATION_ARG.help),
        )
        .arg(
            Arg::new("rpc_timeout")
                .long("rpc-timeout")
                .value_name("SECONDS")
                .takes_value(true)
                .default_value(DEFAULT_RPC_TIMEOUT_SECONDS)
                .global(true)
                .hide(true)
                .help("Timeout value for RPC requests"),
        )
        .arg(
            Arg::new("confirm_transaction_initial_timeout")
                .long("confirm-timeout")
                .value_name("SECONDS")
                .takes_value(true)
                .default_value(DEFAULT_CONFIRM_TX_TIMEOUT_SECONDS)
                .global(true)
                .hide(true)
                .help("Timeout value for initial transaction status"),
        )
        // Subcommands
        .cluster_query_subcommands()
        .config_subcommands()
        .feature_subcommands()
        .inflation_subcommands()
        .nonce_subcommands()
        .program_subcommands()
        .stake_subcommands()
        // TODO:
        // .validator_info_subcommands()
        .vote_subcommands()
        .wallet_subcommands()
}
