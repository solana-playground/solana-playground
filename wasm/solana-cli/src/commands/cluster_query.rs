use std::{
    collections::{BTreeMap, HashMap},
    fmt,
    rc::Rc,
    str::FromStr,
    time::Duration,
};

use clap::{Arg, ArgMatches, Command};
use serde::{Deserialize, Serialize};
use solana_clap_v3_utils_wasm::{
    input_parsers::{pubkey_of_signer, pubkeys_of_multiple_signers, value_of},
    input_validators::is_slot,
};

use solana_cli_output_wasm::{
    cli_output::{
        build_balance_message, format_labeled_address, println_transaction,
        unix_timestamp_to_string, writeln_name_value, CliAccountBalances, CliBlock,
        CliBlockProduction, CliBlockProductionEntry, CliBlockTime, CliEpochInfo,
        CliKeyedStakeState, CliSlotStatus, CliStakeVec, CliSupply, CliValidator, CliValidators,
        CliValidatorsSortOrder, CliValidatorsStakeByVersion, OutputFormat, QuietDisplay,
        VerboseDisplay,
    },
    cli_version::CliVersion,
};
use solana_client_wasm::{
    utils::{
        rpc_config::{
            GetConfirmedSignaturesForAddress2Config, RpcAccountInfoConfig, RpcBlockConfig,
            RpcGetVoteAccountsConfig, RpcLargestAccountsConfig, RpcLargestAccountsFilter,
            RpcProgramAccountsConfig, RpcTransactionConfig,
        },
        rpc_filter::{Memcmp, MemcmpEncodedBytes, MemcmpEncoding, RpcFilterType},
        rpc_request::DELINQUENT_VALIDATOR_SLOT_DISTANCE,
    },
    WasmClient,
};
use solana_extra_wasm::{
    account_decoder::UiAccountEncoding, program::vote::vote_state::VoteState,
    transaction_status::UiTransactionEncoding,
};
use solana_playground_utils_wasm::js::PgTerminal;
use solana_remote_wallet::remote_wallet::RemoteWalletManager;
use solana_sdk::{
    account::from_account,
    account_utils::StateMut,
    clock::{self, Clock, Slot},
    commitment_config::CommitmentConfig,
    epoch_schedule::Epoch,
    native_token::lamports_to_sol,
    nonce::State as NonceState,
    pubkey::Pubkey,
    rent::Rent,
    signature::Signature,
    slot_history,
    stake::{self, state::StakeStateV2},
    sysvar::{
        self,
        slot_history::SlotHistory,
        stake_history::{self},
    },
    timing,
};
use thiserror::Error;

use crate::cli::{CliCommand, CliCommandInfo, CliConfig, CliError, ProcessResult};

pub trait ClusterQuerySubCommands {
    fn cluster_query_subcommands(self) -> Self;
}

impl ClusterQuerySubCommands for Command<'_> {
    fn cluster_query_subcommands(self) -> Self {
        self.subcommand(
            Command::new("block").about("Get a confirmed block").arg(
                Arg::new("slot")
                     .validator(is_slot)
                    .index(1)
                    .takes_value(true)
                    .value_name("SLOT")
                    .help("Slot number of the block to query"),
            ),
        )
        //         .subcommand(
        //             Command::new("catchup")
        //                 .about("Wait for a validator to catch up to the cluster")
        //                 .arg(
        //                     pubkey!(Arg::new("node_pubkey")
        //                         .index(1)
        //                         .value_name("OUR_VALIDATOR_PUBKEY")
        //                         .required(false),
        //                         "Identity pubkey of the validator"),
        //                 )
        //                 .arg(
        //                     Arg::new("node_json_rpc_url")
        //                         .index(2)
        //                         .value_name("OUR_URL")
        //                         .takes_value(true)
        //                          .validator(is_url)
        //                         .help("JSON RPC URL for validator, which is useful for validators with a private RPC service")
        //                 )
        //                 .arg(
        //                     Arg::new("follow")
        //                         .long("follow")
        //                         .takes_value(false)
        //                         .help("Continue reporting progress even after the validator has caught up"),
        //                 )
        //                 .arg(
        //                     Arg::new("our_localhost")
        //                         .long("our-localhost")
        //                         .takes_value(false)
        //                         .value_name("PORT")
        //                         .default_value(DEFAULT_RPC_PORT_STR)
        //                          .validator(is_port)
        //                         .help("Guess Identity pubkey and validator rpc node assuming local (possibly private) validator"),
        //                 )
        //                 .arg(
        //                     Arg::new("log")
        //                         .long("log")
        //                         .takes_value(false)
        //                         .help("Don't update the progress inplace; instead show updates with its own new lines"),
        //                 ),
        //         )
        .subcommand(Command::new("cluster-date").about(
            "Get current cluster date, computed from genesis creation time and network time",
        ))
        .subcommand(
            Command::new("cluster-version").about("Get the version of the cluster entrypoint"),
        )
        //         // Deprecated in v1.8.0
        //         .subcommand(
        //             Command::new("fees")
        //             .about("Display current cluster fees (Deprecated in v1.8.0)")
        //             .arg(
        //                 Arg::new("blockhash")
        //                     .long("blockhash")
        //                     .takes_value(true)
        //                     .value_name("BLOCKHASH")
        //                      .validator(is_hash)
        //                     .help("Query fees for BLOCKHASH instead of the most recent blockhash")
        //             ),
        //         )
        .subcommand(
            Command::new("first-available-block")
                .about("Get the first available block in the storage"),
        )
        .subcommand(
            Command::new("block-time")
                .about("Get estimated production time of a block")
                .alias("get-block-time")
                .arg(
                    Arg::new("slot")
                        .index(1)
                        .takes_value(true)
                        .value_name("SLOT")
                        .help("Slot number of the block to query"),
                ),
        )
        //         .subcommand(Command::new("leader-schedule")
        //             .about("Display leader schedule")
        //             .arg(
        //                 Arg::new("epoch")
        //                     .long("epoch")
        //                     .takes_value(true)
        //                     .value_name("EPOCH")
        //                      .validator(is_epoch)
        //                     .help("Epoch to show leader schedule for. [default: current]")
        //             )
        //         )
        .subcommand(
            Command::new("epoch-info")
                .about("Get information about the current epoch")
                .alias("get-epoch-info"),
        )
        .subcommand(
            Command::new("genesis-hash")
                .about("Get the genesis hash")
                .alias("get-genesis-hash"),
        )
        .subcommand(
            Command::new("slot")
                .about("Get current slot")
                .alias("get-slot"),
        )
        .subcommand(Command::new("block-height").about("Get current block height"))
        .subcommand(Command::new("epoch").about("Get current epoch"))
        .subcommand(
            Command::new("largest-accounts")
                .about("Get addresses of largest cluster accounts")
                .arg(
                    Arg::new("circulating")
                        .long("circulating")
                        .takes_value(false)
                        .help("Filter address list to only circulating accounts"),
                )
                .arg(
                    Arg::new("non_circulating")
                        .long("non-circulating")
                        .takes_value(false)
                        .conflicts_with("circulating")
                        .help("Filter address list to only non-circulating accounts"),
                ),
        )
        .subcommand(
            Command::new("supply")
                .about("Get information about the cluster supply of SOL")
                .arg(
                    Arg::new("print_accounts")
                        .long("print-accounts")
                        .takes_value(false)
                        .help("Print list of non-circulating account addresses"),
                ),
        )
        .subcommand(Command::new("total-supply").about("Get total number of SOL"))
        .subcommand(
            Command::new("transaction-count")
                .about("Get current transaction count")
                .alias("get-transaction-count"),
        )
        //         .subcommand(
        //             Command::new("ping")
        //                 .about("Submit transactions sequentially")
        //                 .arg(
        //                     Arg::new("interval")
        //                         .short("i")
        //                         .long("interval")
        //                         .value_name("SECONDS")
        //                         .takes_value(true)
        //                         .default_value("2")
        //                         .help("Wait interval seconds between submitting the next transaction"),
        //                 )
        //                 .arg(
        //                     Arg::new("count")
        //                         .short("c")
        //                         .long("count")
        //                         .value_name("NUMBER")
        //                         .takes_value(true)
        //                         .help("Stop after submitting count transactions"),
        //                 )
        //                 .arg(
        //                     Arg::new("print_timestamp")
        //                         .short("D")
        //                         .long("print-timestamp")
        //                         .takes_value(false)
        //                         .help("Print timestamp (unix time + microseconds as in gettimeofday) before each line"),
        //                 )
        //                 .arg(
        //                     Arg::new("timeout")
        //                         .short("t")
        //                         .long("timeout")
        //                         .value_name("SECONDS")
        //                         .takes_value(true)
        //                         .default_value("15")
        //                         .help("Wait up to timeout seconds for transaction confirmation"),
        //                 )
        //                 .arg(
        //                     Arg::new("compute_unit_price")
        //                         .long("compute-unit-price")
        //                         .value_name("MICRO-LAMPORTS")
        //                         .takes_value(true)
        //                         .help("Set the price in micro-lamports of each transaction compute unit"),
        //                 )
        //                 .arg(blockhash_arg()),
        //         )
        //         .subcommand(
        //             Command::new("live-slots")
        //                 .about("Show information about the current slot progression"),
        //         )
        //         .subcommand(
        //             Command::new("logs")
        //                 .about("Stream transaction logs")
        //                 .arg(
        //                     pubkey!(Arg::new("address")
        //                         .index(1)
        //                         .value_name("ADDRESS"),
        //                         "Account address to monitor \
        //                          [default: monitor all transactions except for votes] \
        //                         ")
        //                 )
        //                 .arg(
        //                     Arg::new("include_votes")
        //                         .long("include-votes")
        //                         .takes_value(false)
        //                         .conflicts_with("address")
        //                         .help("Include vote transactions when monitoring all transactions")
        //                 ),
        //         )
                .subcommand(
                    Command::new("block-production")
                        .about("Show information about block production")
                        .alias("show-block-production")
                        .arg(
                            Arg::new("epoch")
                                .long("epoch")
                                .takes_value(true)
                                .help("Epoch to show block production for [default: current epoch]"),
                        )
                        .arg(
                            Arg::new("slot_limit")
                                .long("slot-limit")
                                .takes_value(true)
                                .help("Limit results to this many slots from the end of the epoch [default: full epoch]"),
                        ),
                )
        //         .subcommand(
        //             Command::new("gossip")
        //                 .about("Show the current gossip network nodes")
        //                 .alias("show-gossip")
        //         )
                .subcommand(
                    Command::new("stakes")
                        .about("Show stake account information")
                        .arg(
                            pubkey!(Arg::new("vote_account_pubkeys")
                                .index(1)
                                .value_name("VOTE_ACCOUNT_PUBKEYS")
                                .multiple_occurrences(true),
                                "Only show stake accounts delegated to the provided vote accounts. "),
                        )
                        .arg(
                            Arg::new("lamports")
                                .long("lamports")
                                .takes_value(false)
                                .help("Display balance in lamports instead of SOL"),
                        ),
                )
                .subcommand(
                    Command::new("validators")
                        .about("Show summary information about the current validators")
                        .alias("show-validators")
                        .arg(
                            Arg::new("lamports")
                                .long("lamports")
                                .takes_value(false)
                                .help("Display balance in lamports instead of SOL"),
                        )
                        .arg(
                            Arg::new("number")
                                .long("number")
                                .short('n')
                                .takes_value(false)
                                .help("Number the validators"),
                        )
                        .arg(
                            Arg::new("reverse")
                                .long("reverse")
                                .short('r')
                                .takes_value(false)
                                .help("Reverse order while sorting"),
                        )
                        .arg(
                            Arg::new("sort")
                                .long("sort")
                                .takes_value(true)
                                .possible_values([
                                    "delinquent",
                                    "commission",
                                    "credits",
                                    "identity",
                                    "last-vote",
                                    "root",
                                    "skip-rate",
                                    "stake",
                                    "version",
                                    "vote-account",
                                ])
                                .default_value("stake")
                                .help("Sort order (does not affect JSON output)"),
                        )
                        .arg(
                            Arg::new("keep_unstaked_delinquents")
                                .long("keep-unstaked-delinquents")
                                .takes_value(false)
                                .help("Don't discard unstaked, delinquent validators")
                        )
                        .arg(
                            Arg::new("delinquent_slot_distance")
                                .long("delinquent-slot-distance")
                                .takes_value(true)
                                .value_name("SLOT_DISTANCE")
                                 .validator(is_slot)
                                .help(
                                    concatcp!(
                                        "Minimum slot distance from the tip to consider a validator delinquent. [default: ",
                                        DELINQUENT_VALIDATOR_SLOT_DISTANCE,
                                        "]",
                                ))
                        ),
                )
        .subcommand(
            Command::new("transaction-history")
                .about(
                    "Show historical transactions affecting the given address \
                                from newest to oldest",
                )
                .arg(pubkey!(
                    Arg::new("address")
                        .index(1)
                        .value_name("ADDRESS")
                        .required(true),
                    "Account address"
                ))
                .arg(
                    Arg::new("limit")
                        .long("limit")
                        .takes_value(true)
                        .value_name("LIMIT")
                         .validator(is_slot)
                        .default_value("1000")
                        .help("Maximum number of transaction signatures to return"),
                )
                .arg(
                    Arg::new("before")
                        .long("before")
                        .value_name("TRANSACTION_SIGNATURE")
                        .takes_value(true)
                        .help("Start with the first signature older than this one"),
                )
                .arg(
                    Arg::new("show_transactions")
                        .long("show-transactions")
                        .takes_value(false)
                        .help("Display the full transactions"),
                ),
        )
        //         .subcommand(
        //             Command::new("wait-for-max-stake")
        //                 .about("Wait for the max stake of any one node to drop below a percentage of total.")
        //                 .arg(
        //                     Arg::new("max_percent")
        //                         .long("max-percent")
        //                         .value_name("PERCENT")
        //                         .takes_value(true)
        //                         .index(1),
        //                 ),
        //         )
                .subcommand(
                    Command::new("rent")
                        .about("Calculate per-epoch and rent-exempt-minimum values for a given account data field length.")
                        .arg(
                            Arg::new("data_length")
                                .index(1)
                                .value_name("DATA_LENGTH_OR_MONIKER")
                                .required(true)
                                 .validator(|s| {
                                    RentLengthValue::from_str(s)
                                        .map(|_| ())
                                        .map_err(|e| e.to_string())
                                })
                                .help("Length of data field in the account to calculate rent for, or moniker: [nonce, stake, system, vote]"),
                        )
                        .arg(
                            Arg::new("lamports")
                                .long("lamports")
                                .takes_value(false)
                                .help("Display rent in lamports instead of SOL"),
                        ),
                )
    }
}

// pub fn parse_catchup(
//     matches: &ArgMatches,
//     wallet_manager: &mut Option<Arc<RemoteWalletManager>>,
// ) -> Result<CliCommandInfo, CliError> {
//     let node_pubkey = pubkey_of_signer(matches, "node_pubkey", wallet_manager)?;
//     let mut our_localhost_port = value_t!(matches, "our_localhost", u16).ok();
//     // if there is no explicitly specified --our-localhost,
//     // disable the guess mode (= our_localhost_port)
//     if matches.occurrences_of("our_localhost") == 0 {
//         our_localhost_port = None
//     }
//     let node_json_rpc_url = value_t!(matches, "node_json_rpc_url", String).ok();
//     // requirement of node_pubkey is relaxed only if our_localhost_port
//     if our_localhost_port.is_none() && node_pubkey.is_none() {
//         return Err(CliError::BadParameter(
//             "OUR_VALIDATOR_PUBKEY (and possibly OUR_URL) must be specified \
//              unless --our-localhost is given"
//                 .into(),
//         ));
//     }
//     let follow = matches.is_present("follow");
//     let log = matches.is_present("log");
//     Ok(CliCommandInfo {
//         command: CliCommand::Catchup {
//             node_pubkey,
//             node_json_rpc_url,
//             follow,
//             our_localhost_port,
//             log,
//         },
//         signers: vec![],
//     })
// }

// pub fn parse_cluster_ping(
//     matches: &ArgMatches,
//     default_signer: &DefaultSigner,
//     wallet_manager: &mut Option<Arc<RemoteWalletManager>>,
// ) -> Result<CliCommandInfo, CliError> {
//     let interval = Duration::from_secs(value_t_or_exit!(matches, "interval", u64));
//     let count = if matches.is_present("count") {
//         Some(value_t_or_exit!(matches, "count", u64))
//     } else {
//         None
//     };
//     let timeout = Duration::from_secs(value_t_or_exit!(matches, "timeout", u64));
//     let blockhash = value_of(matches, BLOCKHASH_ARG.name);
//     let print_timestamp = matches.is_present("print_timestamp");
//     let compute_unit_price = value_of(matches, "compute_unit_price");
//     Ok(CliCommandInfo {
//         command: CliCommand::Ping {
//             interval,
//             count,
//             timeout,
//             blockhash,
//             print_timestamp,
//             compute_unit_price,
//         },
//         signers: vec![default_signer.signer_from_path(matches, wallet_manager)?],
//     })
// }

pub fn parse_get_block(matches: &ArgMatches) -> Result<CliCommandInfo, CliError> {
    let slot = value_of(matches, "slot");
    Ok(CliCommandInfo {
        command: CliCommand::GetBlock { slot },
        signers: vec![],
    })
}

pub fn parse_get_block_time(matches: &ArgMatches) -> Result<CliCommandInfo, CliError> {
    let slot = value_of(matches, "slot");
    Ok(CliCommandInfo {
        command: CliCommand::GetBlockTime { slot },
        signers: vec![],
    })
}

pub fn parse_get_epoch(_matches: &ArgMatches) -> Result<CliCommandInfo, CliError> {
    Ok(CliCommandInfo {
        command: CliCommand::GetEpoch,
        signers: vec![],
    })
}

pub fn parse_get_epoch_info(_matches: &ArgMatches) -> Result<CliCommandInfo, CliError> {
    Ok(CliCommandInfo {
        command: CliCommand::GetEpochInfo,
        signers: vec![],
    })
}

pub fn parse_get_slot(_matches: &ArgMatches) -> Result<CliCommandInfo, CliError> {
    Ok(CliCommandInfo {
        command: CliCommand::GetSlot,
        signers: vec![],
    })
}

pub fn parse_get_block_height(_matches: &ArgMatches) -> Result<CliCommandInfo, CliError> {
    Ok(CliCommandInfo {
        command: CliCommand::GetBlockHeight,
        signers: vec![],
    })
}

pub fn parse_largest_accounts(matches: &ArgMatches) -> Result<CliCommandInfo, CliError> {
    let filter = if matches.is_present("circulating") {
        Some(RpcLargestAccountsFilter::Circulating)
    } else if matches.is_present("non_circulating") {
        Some(RpcLargestAccountsFilter::NonCirculating)
    } else {
        None
    };
    Ok(CliCommandInfo {
        command: CliCommand::LargestAccounts { filter },
        signers: vec![],
    })
}

pub fn parse_supply(matches: &ArgMatches) -> Result<CliCommandInfo, CliError> {
    let print_accounts = matches.is_present("print_accounts");
    Ok(CliCommandInfo {
        command: CliCommand::Supply { print_accounts },
        signers: vec![],
    })
}

pub fn parse_total_supply(_matches: &ArgMatches) -> Result<CliCommandInfo, CliError> {
    Ok(CliCommandInfo {
        command: CliCommand::TotalSupply,
        signers: vec![],
    })
}

pub fn parse_get_transaction_count(_matches: &ArgMatches) -> Result<CliCommandInfo, CliError> {
    Ok(CliCommandInfo {
        command: CliCommand::GetTransactionCount,
        signers: vec![],
    })
}

pub fn parse_show_stakes(
    matches: &ArgMatches,
    wallet_manager: &mut Option<Rc<RemoteWalletManager>>,
) -> Result<CliCommandInfo, CliError> {
    let use_lamports_unit = matches.is_present("lamports");
    let vote_account_pubkeys =
        pubkeys_of_multiple_signers(matches, "vote_account_pubkeys", wallet_manager)?;

    Ok(CliCommandInfo {
        command: CliCommand::ShowStakes {
            use_lamports_unit,
            vote_account_pubkeys,
        },
        signers: vec![],
    })
}

pub fn parse_show_validators(matches: &ArgMatches) -> Result<CliCommandInfo, CliError> {
    let use_lamports_unit = matches.is_present("lamports");
    let number_validators = matches.is_present("number");
    let reverse_sort = matches.is_present("reverse");
    let keep_unstaked_delinquents = matches.is_present("keep_unstaked_delinquents");
    let delinquent_slot_distance = value_of(matches, "delinquent_slot_distance");

    let sort_order = match matches.value_of_t_or_exit::<String>("sort").as_str() {
        "delinquent" => CliValidatorsSortOrder::Delinquent,
        "commission" => CliValidatorsSortOrder::Commission,
        "credits" => CliValidatorsSortOrder::EpochCredits,
        "identity" => CliValidatorsSortOrder::Identity,
        "last-vote" => CliValidatorsSortOrder::LastVote,
        "root" => CliValidatorsSortOrder::Root,
        "skip-rate" => CliValidatorsSortOrder::SkipRate,
        "stake" => CliValidatorsSortOrder::Stake,
        "vote-account" => CliValidatorsSortOrder::VoteAccount,
        "version" => CliValidatorsSortOrder::Version,
        _ => unreachable!(),
    };

    Ok(CliCommandInfo {
        command: CliCommand::ShowValidators {
            use_lamports_unit,
            sort_order,
            reverse_sort,
            number_validators,
            keep_unstaked_delinquents,
            delinquent_slot_distance,
        },
        signers: vec![],
    })
}

pub fn parse_transaction_history(
    matches: &ArgMatches,
    wallet_manager: &mut Option<Rc<RemoteWalletManager>>,
) -> Result<CliCommandInfo, CliError> {
    let address = pubkey_of_signer(matches, "address", wallet_manager)?.unwrap();

    let before = match matches.value_of("before") {
        Some(signature) => Some(
            signature
                .parse()
                .map_err(|err| CliError::BadParameter(format!("Invalid signature: {}", err)))?,
        ),
        None => None,
    };
    let until = match matches.value_of("until") {
        Some(signature) => Some(
            signature
                .parse()
                .map_err(|err| CliError::BadParameter(format!("Invalid signature: {}", err)))?,
        ),
        None => None,
    };
    let limit = matches.value_of_t_or_exit::<usize>("limit");
    let show_transactions = matches.is_present("show_transactions");

    Ok(CliCommandInfo {
        command: CliCommand::TransactionHistory {
            address,
            before,
            until,
            limit,
            show_transactions,
        },
        signers: vec![],
    })
}

// pub fn process_catchup(
//     rpc_client: &WasmClient,
//     config: &CliConfig<'_>,
//     node_pubkey: Option<Pubkey>,
//     mut node_json_rpc_url: Option<String>,
//     follow: bool,
//     our_localhost_port: Option<u16>,
//     log: bool,
// ) -> ProcessResult {
//     let sleep_interval = 5;

//     let progress_bar = new_spinner_progress_bar();
//     progress_bar.set_message("Connecting...");

//     if let Some(our_localhost_port) = our_localhost_port {
//         let gussed_default = Some(format!("http://localhost:{}", our_localhost_port));
//         if node_json_rpc_url.is_some() && node_json_rpc_url != gussed_default {
//             // go to new line to leave this message on console
//             PgTerminal::log_wasm(
//                 "Preferring explicitly given rpc ({}) as us, \
//                  although --our-localhost is given\n",
//                 node_json_rpc_url.as_ref().unwrap()
//             );
//         } else {
//             node_json_rpc_url = gussed_default;
//         }
//     }

//     let (node_client, node_pubkey) = if our_localhost_port.is_some() {
//         let client = WasmClient::new(node_json_rpc_url.unwrap());
//         let guessed_default = Some(client.get_identity()?);
//         (
//             client,
//             (if node_pubkey.is_some() && node_pubkey != guessed_default {
//                 // go to new line to leave this message on console
//                 PgTerminal::log_wasm(
//                     "Preferring explicitly given node pubkey ({}) as us, \
//                      although --our-localhost is given\n",
//                     node_pubkey.unwrap()
//                 );
//                 node_pubkey
//             } else {
//                 guessed_default
//             })
//             .unwrap(),
//         )
//     } else if let Some(node_pubkey) = node_pubkey {
//         if let Some(node_json_rpc_url) = node_json_rpc_url {
//             (WasmClient::new(node_json_rpc_url), node_pubkey)
//         } else {
//             let rpc_addr = loop {
//                 let cluster_nodes = rpc_client.get_cluster_nodes()?;
//                 if let Some(contact_info) = cluster_nodes
//                     .iter()
//                     .find(|contact_info| contact_info.pubkey == node_pubkey.to_string())
//                 {
//                     if let Some(rpc_addr) = contact_info.rpc {
//                         break rpc_addr;
//                     }
//                     progress_bar.set_message(format!("RPC service not found for {}", node_pubkey));
//                 } else {
//                     progress_bar
//                         .set_message(format!("Contact information not found for {}", node_pubkey));
//                 }
//                 sleep(Duration::from_secs(sleep_interval as u64));
//             };

//             (WasmClient::new_socket(rpc_addr), node_pubkey)
//         }
//     } else {
//         unreachable!()
//     };

//     let reported_node_pubkey = loop {
//         match node_client.get_identity() {
//             Ok(reported_node_pubkey) => break reported_node_pubkey,
//             Err(err) => {
//                 if let ClientErrorKind::Reqwest(err) = err.kind() {
//                     progress_bar.set_message(format!("Connection failed: {}", err));
//                     sleep(Duration::from_secs(sleep_interval as u64));
//                     continue;
//                 }
//                 return Err(Box::new(err));
//             }
//         }
//     };

//     if reported_node_pubkey != node_pubkey {
//         return Err(format!(
//             "The identity reported by node RPC URL does not match.  Expected: {:?}.  Reported: {:?}",
//             node_pubkey, reported_node_pubkey
//         )
//         .into());
//     }

//     if rpc_client.get_identity()? == node_pubkey {
//         return Err("Both RPC URLs reference the same node, unable to monitor for catchup.  Try a different --url".into());
//     }

//     let mut previous_rpc_slot = std::u64::MAX;
//     let mut previous_slot_distance = 0;
//     let mut retry_count = 0;
//     let max_retry_count = 5;
//     let mut get_slot_while_retrying = |client: &WasmClient| {
//         loop {
//             match client.get_slot_with_commitment(config.commitment) {
//                 Ok(r) => {
//                     retry_count = 0;
//                     return Ok(r);
//                 }
//                 Err(e) => {
//                     if retry_count >= max_retry_count {
//                         return Err(e);
//                     }
//                     retry_count += 1;
//                     if log {
//                         // go to new line to leave this message on console
//                         PgTerminal::log_wasm("Retrying({}/{}): {}\n", retry_count, max_retry_count, e);
//                     }
//                     sleep(Duration::from_secs(1));
//                 }
//             };
//         }
//     };

//     let start_node_slot = get_slot_while_retrying(&node_client)?;
//     let start_rpc_slot = get_slot_while_retrying(rpc_client)?;
//     let start_slot_distance = start_rpc_slot as i64 - start_node_slot as i64;
//     let mut total_sleep_interval = 0;
//     loop {
//         // humbly retry; the reference node (rpc_client) could be spotty,
//         // especially if pointing to api.meinnet-beta.solana.com at times
//         let rpc_slot = get_slot_while_retrying(rpc_client)?;
//         let node_slot = get_slot_while_retrying(&node_client)?;
//         if !follow && node_slot > std::cmp::min(previous_rpc_slot, rpc_slot) {
//             progress_bar.finish_and_clear();
//             return Ok(format!(
//                 "{} has caught up (us:{} them:{})",
//                 node_pubkey, node_slot, rpc_slot,
//             ));
//         }

//         let slot_distance = rpc_slot as i64 - node_slot as i64;
//         let slots_per_second =
//             (previous_slot_distance - slot_distance) as f64 / f64::from(sleep_interval);

//         let average_time_remaining = if slot_distance == 0 || total_sleep_interval == 0 {
//             "".to_string()
//         } else {
//             let distance_delta = start_slot_distance as i64 - slot_distance as i64;
//             let average_catchup_slots_per_second =
//                 distance_delta as f64 / f64::from(total_sleep_interval);
//             let average_time_remaining =
//                 (slot_distance as f64 / average_catchup_slots_per_second).round();
//             if !average_time_remaining.is_normal() {
//                 "".to_string()
//             } else if average_time_remaining < 0.0 {
//                 format!(
//                     " (AVG: {:.1} slots/second (falling))",
//                     average_catchup_slots_per_second
//                 )
//             } else {
//                 // important not to miss next scheduled lead slots
//                 let total_node_slot_delta = node_slot as i64 - start_node_slot as i64;
//                 let average_node_slots_per_second =
//                     total_node_slot_delta as f64 / f64::from(total_sleep_interval);
//                 let expected_finish_slot = (node_slot as f64
//                     + average_time_remaining as f64 * average_node_slots_per_second as f64)
//                     .round();
//                 format!(
//                     " (AVG: {:.1} slots/second, ETA: slot {} in {})",
//                     average_catchup_slots_per_second,
//                     expected_finish_slot,
//                     humantime::format_duration(Duration::from_secs_f64(average_time_remaining))
//                 )
//             }
//         };

//         progress_bar.set_message(format!(
//             "{} slot(s) {} (us:{} them:{}){}",
//             slot_distance.abs(),
//             if slot_distance >= 0 {
//                 "behind"
//             } else {
//                 "ahead"
//             },
//             node_slot,
//             rpc_slot,
//             if slot_distance == 0 || previous_rpc_slot == std::u64::MAX {
//                 "".to_string()
//             } else {
//                 format!(
//                     ", {} node is {} at {:.1} slots/second{}",
//                     if slot_distance >= 0 { "our" } else { "their" },
//                     if slots_per_second < 0.0 {
//                         "falling behind"
//                     } else {
//                         "gaining"
//                     },
//                     slots_per_second,
//                     average_time_remaining
//                 )
//             },
//         ));
//         if log {
//             PgTerminal::log_wasm();
//         }

//         sleep(Duration::from_secs(sleep_interval as u64));
//         previous_rpc_slot = rpc_slot;
//         previous_slot_distance = slot_distance;
//         total_sleep_interval += sleep_interval;
//     }
// }

pub async fn process_cluster_date(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
) -> ProcessResult {
    let maybe_account = rpc_client
        .get_account_with_commitment(&sysvar::clock::id(), config.commitment_config)
        .await?;
    let slot = rpc_client.get_slot().await?;

    if let Some(clock_account) = maybe_account {
        let clock: Clock = from_account(&clock_account).ok_or_else(|| {
            CliError::RpcRequestError("Failed to deserialize clock sysvar".to_string())
        })?;
        let block_time = CliBlockTime {
            slot,
            timestamp: clock.unix_timestamp,
        };
        Ok(config.output_format.formatted_string(&block_time))
    } else {
        Err(format!("AccountNotFound: pubkey={}", sysvar::clock::id()).into())
    }
}

pub async fn process_cluster_version(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
) -> ProcessResult {
    let remote_version = rpc_client.get_version().await?;

    if config.verbose {
        Ok(format!("{:?}", remote_version))
    } else {
        Ok(remote_version.to_string())
    }
}

// pub fn process_fees(
//     rpc_client: &WasmClient,
//     config: &CliConfig<'_>,
//     blockhash: Option<&Hash>,
// ) -> ProcessResult {
//     let fees = if let Some(recent_blockhash) = blockhash {
//         #[allow(deprecated)]
//         let result = rpc_client.get_fee_calculator_for_blockhash_with_commitment(
//             recent_blockhash,
//             config.commitment,
//         )?;
//         if let Some(fee_calculator) = result.value {
//             CliFees::some(
//                 result.context.slot,
//                 *recent_blockhash,
//                 fee_calculator.lamports_per_signature,
//                 None,
//                 None,
//             )
//         } else {
//             CliFees::none()
//         }
//     } else {
//         #[allow(deprecated)]
//         let result = rpc_client.get_fees_with_commitment(config.commitment)?;
//         CliFees::some(
//             result.context.slot,
//             result.value.blockhash,
//             result.value.fee_calculator.lamports_per_signature,
//             None,
//             Some(result.value.last_valid_block_height),
//         )
//     };
//     Ok(config.output_format.formatted_string(&fees))
// }

pub async fn process_first_available_block(rpc_client: &WasmClient) -> ProcessResult {
    let first_available_block = rpc_client.get_first_available_block().await?;
    Ok(format!("{}", first_available_block))
}

// pub fn parse_leader_schedule(matches: &ArgMatches) -> Result<CliCommandInfo, CliError> {
//     let epoch = value_of(matches, "epoch");
//     Ok(CliCommandInfo {
//         command: CliCommand::LeaderSchedule { epoch },
//         signers: vec![],
//     })
// }

// pub fn process_leader_schedule(
//     rpc_client: &WasmClient,
//     config: &CliConfig<'_>,
//     epoch: Option<Epoch>,
// ) -> ProcessResult {
//     let epoch_info = rpc_client.get_epoch_info()?;
//     let epoch = epoch.unwrap_or(epoch_info.epoch);
//     if epoch > epoch_info.epoch {
//         return Err(format!("Epoch {} is in the future", epoch).into());
//     }

//     let epoch_schedule = rpc_client.get_epoch_schedule()?;
//     let first_slot_in_epoch = epoch_schedule.get_first_slot_in_epoch(epoch);

//     let leader_schedule = rpc_client.get_leader_schedule(Some(first_slot_in_epoch))?;
//     if leader_schedule.is_none() {
//         return Err(format!(
//             "Unable to fetch leader schedule for slot {}",
//             first_slot_in_epoch
//         )
//         .into());
//     }
//     let leader_schedule = leader_schedule.unwrap();

//     let mut leader_per_slot_index = Vec::new();
//     for (pubkey, leader_slots) in leader_schedule.iter() {
//         for slot_index in leader_slots.iter() {
//             if *slot_index >= leader_per_slot_index.len() {
//                 leader_per_slot_index.resize(*slot_index + 1, "?");
//             }
//             leader_per_slot_index[*slot_index] = pubkey;
//         }
//     }

//     let mut leader_schedule_entries = vec![];
//     for (slot_index, leader) in leader_per_slot_index.iter().enumerate() {
//         leader_schedule_entries.push(CliLeaderScheduleEntry {
//             slot: first_slot_in_epoch + slot_index as u64,
//             leader: leader.to_string(),
//         });
//     }

//     Ok(config.output_format.formatted_string(&CliLeaderSchedule {
//         epoch,
//         leader_schedule_entries,
//     }))
// }

pub async fn process_get_block(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    slot: Option<Slot>,
) -> ProcessResult {
    let slot = if let Some(slot) = slot {
        slot
    } else {
        rpc_client
            .get_slot_with_commitment(CommitmentConfig::finalized())
            .await?
    };

    let encoded_confirmed_block = rpc_client
        .get_block_with_config(
            slot,
            RpcBlockConfig {
                encoding: Some(UiTransactionEncoding::Base64),
                commitment: Some(CommitmentConfig::confirmed()),
                max_supported_transaction_version: Some(0),
                ..RpcBlockConfig::default()
            },
        )
        .await?
        .into();

    let cli_block = CliBlock {
        encoded_confirmed_block,
        slot,
    };

    Ok(config.output_format.formatted_string(&cli_block))
}

pub async fn process_get_block_time(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    slot: Option<Slot>,
) -> ProcessResult {
    let slot = if let Some(slot) = slot {
        slot
    } else {
        rpc_client
            .get_slot_with_commitment(CommitmentConfig::finalized())
            .await?
    };
    let timestamp = rpc_client.get_block_time(slot).await?;
    let block_time = CliBlockTime { slot, timestamp };
    Ok(config.output_format.formatted_string(&block_time))
}

pub async fn process_get_epoch(rpc_client: &WasmClient, _config: &CliConfig<'_>) -> ProcessResult {
    let epoch_info = rpc_client.get_epoch_info().await?;
    Ok(epoch_info.epoch.to_string())
}

pub async fn process_get_epoch_info(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
) -> ProcessResult {
    let epoch_info = rpc_client.get_epoch_info().await?;
    let mut cli_epoch_info = CliEpochInfo {
        epoch_info,
        average_slot_time_ms: 0,
        start_block_time: None,
        current_block_time: None,
    };
    match config.output_format {
        OutputFormat::Json | OutputFormat::JsonCompact => {}
        _ => {
            let epoch_info = cli_epoch_info.epoch_info.clone();
            let average_slot_time_ms = rpc_client
                .get_recent_performance_samples(Some(60))
                .await
                .ok()
                .and_then(|samples| {
                    let (slots, secs) = samples.iter().fold((0, 0), |(slots, secs), sample| {
                        (slots + sample.num_slots, secs + sample.sample_period_secs)
                    });
                    (secs as u64).saturating_mul(1000).checked_div(slots)
                })
                .unwrap_or(clock::DEFAULT_MS_PER_SLOT);
            let epoch_expected_start_slot = epoch_info.absolute_slot - epoch_info.slot_index;
            let first_block_in_epoch = rpc_client
                .get_blocks_with_limit(epoch_expected_start_slot, 1)
                .await
                .ok()
                .and_then(|slot_vec| slot_vec.first().cloned())
                .unwrap_or(epoch_expected_start_slot);
            let start_block_time = rpc_client
                .get_block_time(first_block_in_epoch)
                .await
                .ok()
                .map(|time| {
                    time + (((first_block_in_epoch - epoch_expected_start_slot)
                        * average_slot_time_ms)
                        / 1000) as i64
                });
            let current_block_time = rpc_client
                .get_block_time(epoch_info.absolute_slot)
                .await
                .ok();

            cli_epoch_info.average_slot_time_ms = average_slot_time_ms;
            cli_epoch_info.start_block_time = start_block_time;
            cli_epoch_info.current_block_time = current_block_time;
        }
    }
    Ok(config.output_format.formatted_string(&cli_epoch_info))
}

pub async fn process_get_genesis_hash(rpc_client: &WasmClient) -> ProcessResult {
    let genesis_hash = rpc_client.get_genesis_hash().await?;
    Ok(genesis_hash.to_string())
}

pub async fn process_get_slot(rpc_client: &WasmClient, _config: &CliConfig<'_>) -> ProcessResult {
    let slot = rpc_client.get_slot().await?;
    Ok(slot.to_string())
}

pub async fn process_get_block_height(
    rpc_client: &WasmClient,
    _config: &CliConfig<'_>,
) -> ProcessResult {
    let block_height = rpc_client.get_block_height().await?;
    Ok(block_height.to_string())
}

pub fn parse_show_block_production(matches: &ArgMatches) -> Result<CliCommandInfo, CliError> {
    let epoch = matches.value_of_t::<Epoch>("epoch").ok();
    let slot_limit = matches.value_of_t::<u64>("slot_limit").ok();

    Ok(CliCommandInfo {
        command: CliCommand::ShowBlockProduction { epoch, slot_limit },
        signers: vec![],
    })
}

pub async fn process_show_block_production(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    epoch: Option<Epoch>,
    slot_limit: Option<u64>,
) -> ProcessResult {
    let epoch_schedule = rpc_client.get_epoch_schedule().await?;
    let epoch_info = rpc_client
        .get_epoch_info_with_commitment(CommitmentConfig::finalized())
        .await?;

    let epoch = epoch.unwrap_or(epoch_info.epoch);
    if epoch > epoch_info.epoch {
        return Err(format!("Epoch {} is in the future", epoch).into());
    }

    let first_slot_in_epoch = epoch_schedule.get_first_slot_in_epoch(epoch);
    let end_slot = std::cmp::min(
        epoch_info.absolute_slot,
        epoch_schedule.get_last_slot_in_epoch(epoch),
    );

    let mut start_slot = if let Some(slot_limit) = slot_limit {
        std::cmp::max(end_slot.saturating_sub(slot_limit), first_slot_in_epoch)
    } else {
        first_slot_in_epoch
    };

    // let progress_bar = new_spinner_progress_bar();
    // progress_bar.set_message(format!(
    //     "Fetching confirmed blocks between slots {} and {}...",
    //     start_slot, end_slot
    // ));

    let slot_history_account = rpc_client
        .get_account_with_commitment(&sysvar::slot_history::id(), CommitmentConfig::finalized())
        .await?
        .unwrap();

    let slot_history: SlotHistory = from_account(&slot_history_account).ok_or_else(|| {
        CliError::RpcRequestError("Failed to deserialize slot history".to_string())
    })?;

    let (confirmed_blocks, start_slot) =
        if start_slot >= slot_history.oldest() && end_slot <= slot_history.newest() {
            // Fast, more reliable path using the SlotHistory sysvar

            let confirmed_blocks: Vec<_> = (start_slot..=end_slot)
                .filter(|slot| slot_history.check(*slot) == slot_history::Check::Found)
                .collect();
            (confirmed_blocks, start_slot)
        } else {
            // Slow, less reliable path using `getBlocks`.
            //
            // "less reliable" because if the RPC node has holds in its ledger then the block production data will be
            // incorrect.  This condition currently can't be detected over RPC
            //

            let minimum_ledger_slot = rpc_client.minimum_ledger_slot().await?;
            if minimum_ledger_slot > end_slot {
                return Err(format!(
                    "Ledger data not available for slots {} to {} (minimum ledger slot is {})",
                    start_slot, end_slot, minimum_ledger_slot
                )
                .into());
            }

            if minimum_ledger_slot > start_slot {
                // progress_bar.println(format!(
                //     "{}",
                //     style(format!(
                //         "Note: Requested start slot was {} but minimum ledger slot is {}",
                //         start_slot, minimum_ledger_slot
                //     ))
                //     .italic(),
                // ));
                start_slot = minimum_ledger_slot;
            }

            let confirmed_blocks = rpc_client.get_blocks(start_slot, Some(end_slot)).await?;
            (confirmed_blocks, start_slot)
        };

    let start_slot_index = (start_slot - first_slot_in_epoch) as usize;
    let end_slot_index = (end_slot - first_slot_in_epoch) as usize;
    let total_slots = end_slot_index - start_slot_index + 1;
    let total_blocks_produced = confirmed_blocks.len();
    assert!(total_blocks_produced <= total_slots);
    let total_slots_skipped = total_slots - total_blocks_produced;
    let mut leader_slot_count = HashMap::new();
    let mut leader_skipped_slots = HashMap::new();

    // progress_bar.set_message(format!("Fetching leader schedule for epoch {}...", epoch));
    let leader_schedule = rpc_client
        .get_leader_schedule_with_commitment(Some(start_slot), CommitmentConfig::finalized())
        .await?;
    if leader_schedule.is_none() {
        return Err(format!("Unable to fetch leader schedule for slot {}", start_slot).into());
    }
    let leader_schedule = leader_schedule.unwrap();

    let mut leader_per_slot_index = Vec::new();
    leader_per_slot_index.resize(total_slots, "?".to_string());
    for (pubkey, leader_slots) in leader_schedule.iter() {
        let pubkey = format_labeled_address(pubkey, &config.address_labels);
        for slot_index in leader_slots.iter() {
            if *slot_index >= start_slot_index && *slot_index <= end_slot_index {
                leader_per_slot_index[*slot_index - start_slot_index].clone_from(&pubkey);
            }
        }
    }

    // progress_bar.set_message(format!(
    //     "Processing {} slots containing {} blocks and {} empty slots...",
    //     total_slots, total_blocks_produced, total_slots_skipped
    // ));

    let mut confirmed_blocks_index = 0;
    let mut individual_slot_status = vec![];
    for (slot_index, leader) in leader_per_slot_index.iter().enumerate() {
        let slot = start_slot + slot_index as u64;
        let slot_count = leader_slot_count.entry(leader).or_insert(0);
        *slot_count += 1;
        let skipped_slots = leader_skipped_slots.entry(leader).or_insert(0);

        loop {
            if confirmed_blocks_index < confirmed_blocks.len() {
                let slot_of_next_confirmed_block = confirmed_blocks[confirmed_blocks_index];
                if slot_of_next_confirmed_block < slot {
                    confirmed_blocks_index += 1;
                    continue;
                }
                if slot_of_next_confirmed_block == slot {
                    individual_slot_status.push(CliSlotStatus {
                        slot,
                        leader: (*leader).to_string(),
                        skipped: false,
                    });
                    break;
                }
            }
            *skipped_slots += 1;
            individual_slot_status.push(CliSlotStatus {
                slot,
                leader: (*leader).to_string(),
                skipped: true,
            });
            break;
        }
    }

    // progress_bar.finish_and_clear();

    let mut leaders: Vec<CliBlockProductionEntry> = leader_slot_count
        .iter()
        .map(|(leader, leader_slots)| {
            let skipped_slots = leader_skipped_slots.get(leader).unwrap();
            let blocks_produced = leader_slots - skipped_slots;
            CliBlockProductionEntry {
                identity_pubkey: (**leader).to_string(),
                leader_slots: *leader_slots,
                blocks_produced,
                skipped_slots: *skipped_slots,
            }
        })
        .collect();
    leaders.sort_by(|a, b| a.identity_pubkey.partial_cmp(&b.identity_pubkey).unwrap());
    let block_production = CliBlockProduction {
        epoch,
        start_slot,
        end_slot,
        total_slots,
        total_blocks_produced,
        total_slots_skipped,
        leaders,
        individual_slot_status,
        verbose: config.verbose,
    };
    Ok(config.output_format.formatted_string(&block_production))
}

pub async fn process_largest_accounts(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    filter: Option<RpcLargestAccountsFilter>,
) -> ProcessResult {
    let accounts = rpc_client
        .get_largest_accounts_with_config(RpcLargestAccountsConfig {
            commitment: Some(config.commitment_config),
            filter,
        })
        .await?;
    let largest_accounts = CliAccountBalances { accounts };
    Ok(config.output_format.formatted_string(&largest_accounts))
}

pub async fn process_supply(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    print_accounts: bool,
) -> ProcessResult {
    let client_supply_response = rpc_client.get_supply().await?;
    let mut supply: CliSupply = client_supply_response.into();
    supply.print_accounts = print_accounts;
    Ok(config.output_format.formatted_string(&supply))
}

pub async fn process_total_supply(
    rpc_client: &WasmClient,
    _config: &CliConfig<'_>,
) -> ProcessResult {
    let supply = rpc_client.get_supply().await?;
    Ok(format!("{} SOL", lamports_to_sol(supply.total)))
}

pub async fn process_get_transaction_count(
    rpc_client: &WasmClient,
    _config: &CliConfig<'_>,
) -> ProcessResult {
    let transaction_count = rpc_client.get_transaction_count().await?;
    Ok(transaction_count.to_string())
}

// pub fn process_ping(
//     rpc_client: &WasmClient,
//     config: &CliConfig<'_>,
//     interval: &Duration,
//     count: &Option<u64>,
//     timeout: &Duration,
//     fixed_blockhash: &Option<Hash>,
//     print_timestamp: bool,
//     compute_unit_price: &Option<u64>,
// ) -> ProcessResult {
//     let (signal_sender, signal_receiver) = unbounded();
//     ctrlc::set_handler(move || {
//         let _ = signal_sender.send(());
//     })
//     .expect("Error setting Ctrl-C handler");

//     let mut cli_pings = vec![];

//     let mut submit_count = 0;
//     let mut confirmed_count = 0;
//     let mut confirmation_time: VecDeque<u64> = VecDeque::with_capacity(1024);

//     let mut blockhash = rpc_client.get_latest_blockhash()?;
//     let mut lamports = 0;
//     let mut blockhash_acquired = Instant::now();
//     let mut blockhash_from_cluster = false;
//     if let Some(fixed_blockhash) = fixed_blockhash {
//         if *fixed_blockhash != Hash::default() {
//             blockhash = *fixed_blockhash;
//         } else {
//             blockhash_from_cluster = true;
//         }
//     }

//     'mainloop: for seq in 0..count.unwrap_or(std::u64::MAX) {
//         let now = Instant::now();
//         if fixed_blockhash.is_none() && now.duration_since(blockhash_acquired).as_secs() > 60 {
//             // Fetch a new blockhash every minute
//             let new_blockhash = rpc_client.get_new_latest_blockhash(&blockhash)?;
//             blockhash = new_blockhash;
//             lamports = 0;
//             blockhash_acquired = Instant::now();
//         }

//         let to = config.signers[0].pubkey();
//         lamports += 1;

//         let build_message = |lamports| {
//             let mut ixs = vec![system_instruction::transfer(
//                 &config.signers[0].pubkey(),
//                 &to,
//                 lamports,
//             )];
//             if let Some(compute_unit_price) = compute_unit_price {
//                 ixs.push(ComputeBudgetInstruction::set_compute_unit_price(
//                     *compute_unit_price,
//                 ));
//             }
//             Message::new(&ixs, Some(&config.signers[0].pubkey()))
//         };
//         let (message, _) = resolve_spend_tx_and_check_account_balance(
//             rpc_client,
//             false,
//             SpendAmount::Some(lamports),
//             &blockhash,
//             &config.signers[0].pubkey(),
//             build_message,
//             config.commitment,
//         )?;
//         let mut tx = Transaction::new_unsigned(message);
//         tx.try_sign(&config.signers, blockhash)?;

//         let timestamp = || {
//             let micros = SystemTime::now()
//                 .duration_since(UNIX_EPOCH)
//                 .unwrap()
//                 .as_micros();
//             format!("[{}.{:06}] ", micros / 1_000_000, micros % 1_000_000)
//         };

//         match rpc_client.send_transaction(&tx) {
//             Ok(signature) => {
//                 let transaction_sent = Instant::now();
//                 loop {
//                     let signature_status = rpc_client.get_signature_status(&signature)?;
//                     let elapsed_time = Instant::now().duration_since(transaction_sent);
//                     if let Some(transaction_status) = signature_status {
//                         match transaction_status {
//                             Ok(()) => {
//                                 let elapsed_time_millis = elapsed_time.as_millis() as u64;
//                                 confirmation_time.push_back(elapsed_time_millis);
//                                 let cli_ping_data = CliPingData {
//                                     success: true,
//                                     signature: Some(signature.to_string()),
//                                     ms: Some(elapsed_time_millis),
//                                     error: None,
//                                     timestamp: timestamp(),
//                                     print_timestamp,
//                                     sequence: seq,
//                                     lamports: Some(lamports),
//                                 };
//                                 eprint!("{}", cli_ping_data);
//                                 cli_pings.push(cli_ping_data);
//                                 confirmed_count += 1;
//                             }
//                             Err(err) => {
//                                 let cli_ping_data = CliPingData {
//                                     success: false,
//                                     signature: Some(signature.to_string()),
//                                     ms: None,
//                                     error: Some(err.to_string()),
//                                     timestamp: timestamp(),
//                                     print_timestamp,
//                                     sequence: seq,
//                                     lamports: None,
//                                 };
//                                 eprint!("{}", cli_ping_data);
//                                 cli_pings.push(cli_ping_data);
//                             }
//                         }
//                         break;
//                     }

//                     if elapsed_time >= *timeout {
//                         let cli_ping_data = CliPingData {
//                             success: false,
//                             signature: Some(signature.to_string()),
//                             ms: None,
//                             error: None,
//                             timestamp: timestamp(),
//                             print_timestamp,
//                             sequence: seq,
//                             lamports: None,
//                         };
//                         eprint!("{}", cli_ping_data);
//                         cli_pings.push(cli_ping_data);
//                         break;
//                     }

//                     // Sleep for half a slot
//                     if signal_receiver
//                         .recv_timeout(Duration::from_millis(clock::DEFAULT_MS_PER_SLOT / 2))
//                         .is_ok()
//                     {
//                         break 'mainloop;
//                     }
//                 }
//             }
//             Err(err) => {
//                 let cli_ping_data = CliPingData {
//                     success: false,
//                     signature: None,
//                     ms: None,
//                     error: Some(err.to_string()),
//                     timestamp: timestamp(),
//                     print_timestamp,
//                     sequence: seq,
//                     lamports: None,
//                 };
//                 eprint!("{}", cli_ping_data);
//                 cli_pings.push(cli_ping_data);
//             }
//         }
//         submit_count += 1;

//         if signal_receiver.recv_timeout(*interval).is_ok() {
//             break 'mainloop;
//         }
//     }

//     let transaction_stats = CliPingTxStats {
//         num_transactions: submit_count,
//         num_transaction_confirmed: confirmed_count,
//     };
//     let confirmation_stats = if !confirmation_time.is_empty() {
//         let samples: Vec<f64> = confirmation_time.iter().map(|t| *t as f64).collect();
//         let dist = criterion_stats::Distribution::from(samples.into_boxed_slice());
//         let mean = dist.mean();
//         Some(CliPingConfirmationStats {
//             min: dist.min(),
//             mean,
//             max: dist.max(),
//             std_dev: dist.std_dev(Some(mean)),
//         })
//     } else {
//         None
//     };

//     let cli_ping = CliPing {
//         source_pubkey: config.signers[0].pubkey().to_string(),
//         fixed_blockhash: fixed_blockhash.map(|_| blockhash.to_string()),
//         blockhash_from_cluster,
//         pings: cli_pings,
//         transaction_stats,
//         confirmation_stats,
//     };

//     Ok(config.output_format.formatted_string(&cli_ping))
// }

// pub fn parse_logs(
//     matches: &ArgMatches,
//     wallet_manager: &mut Option<Arc<RemoteWalletManager>>,
// ) -> Result<CliCommandInfo, CliError> {
//     let address = pubkey_of_signer(matches, "address", wallet_manager)?;
//     let include_votes = matches.is_present("include_votes");

//     let filter = match address {
//         None => {
//             if include_votes {
//                 RpcTransactionLogsFilter::AllWithVotes
//             } else {
//                 RpcTransactionLogsFilter::All
//             }
//         }
//         Some(address) => RpcTransactionLogsFilter::Mentions(vec![address.to_string()]),
//     };

//     Ok(CliCommandInfo {
//         command: CliCommand::Logs { filter },
//         signers: vec![],
//     })
// }

// pub fn process_logs(config: &CliConfig<'_>, filter: &RpcTransactionLogsFilter) -> ProcessResult {
//     PgTerminal::log_wasm(
//         "Streaming transaction logs{}. {:?} commitment",
//         match filter {
//             RpcTransactionLogsFilter::All => "".into(),
//             RpcTransactionLogsFilter::AllWithVotes => " (including votes)".into(),
//             RpcTransactionLogsFilter::Mentions(addresses) =>
//                 format!(" mentioning {}", addresses.join(",")),
//         },
//         config.commitment.commitment
//     );

//     let (_client, receiver) = PubsubClient::logs_subscribe(
//         &config.websocket_url,
//         filter.clone(),
//         RpcTransactionLogsConfig {
//             commitment: Some(config.commitment),
//         },
//     )?;

//     loop {
//         match receiver.recv() {
//             Ok(logs) => {
//                 PgTerminal::log_wasm("Transaction executed in slot {}:", logs.context.slot);
//                 PgTerminal::log_wasm("  Signature: {}", logs.value.signature);
//                 PgTerminal::log_wasm(
//                     "  Status: {}",
//                     logs.value
//                         .err
//                         .map(|err| err.to_string())
//                         .unwrap_or_else(|| "Ok".to_string())
//                 );
//                 PgTerminal::log_wasm("  Log Messages:");
//                 for log in logs.value.logs {
//                     PgTerminal::log_wasm("    {}", log);
//                 }
//             }
//             Err(err) => {
//                 return Ok(format!("Disconnected: {}", err));
//             }
//         }
//     }
// }

// pub fn process_live_slots(config: &CliConfig<'_>) -> ProcessResult {
//     let exit = Arc::new(AtomicBool::new(false));

//     let mut current: Option<SlotInfo> = None;
//     let mut message = "".to_string();

//     let slot_progress = new_spinner_progress_bar();
//     slot_progress.set_message("Connecting...");
//     let (mut client, receiver) = PubsubClient::slot_subscribe(&config.websocket_url)?;
//     slot_progress.set_message("Connected.");

//     let spacer = "|";
//     slot_progress.println(spacer);

//     let mut last_root = std::u64::MAX;
//     let mut last_root_update = Instant::now();
//     let mut slots_per_second = std::f64::NAN;
//     loop {
//         if exit.load(Ordering::Relaxed) {
//             PgTerminal::log_wasm("{}", message);
//             client.shutdown().unwrap();
//             break;
//         }

//         match receiver.recv() {
//             Ok(new_info) => {
//                 if last_root == std::u64::MAX {
//                     last_root = new_info.root;
//                     last_root_update = Instant::now();
//                 }
//                 if last_root_update.elapsed().as_secs() >= 5 {
//                     let root = new_info.root;
//                     slots_per_second =
//                         (root - last_root) as f64 / last_root_update.elapsed().as_secs() as f64;
//                     last_root_update = Instant::now();
//                     last_root = root;
//                 }

//                 message = if slots_per_second.is_nan() {
//                     format!("{:?}", new_info)
//                 } else {
//                     format!(
//                         "{:?} | root slot advancing at {:.2} slots/second",
//                         new_info, slots_per_second
//                     )
//                 };
//                 slot_progress.set_message(message.clone());

//                 if let Some(previous) = current {
//                     let slot_delta: i64 = new_info.slot as i64 - previous.slot as i64;
//                     let root_delta: i64 = new_info.root as i64 - previous.root as i64;

//                     //
//                     // if slot has advanced out of step with the root, we detect
//                     // a mismatch and output the slot information
//                     //
//                     if slot_delta != root_delta {
//                         let prev_root = format!(
//                             "|<--- {} <- … <- {} <- {}   (prev)",
//                             previous.root, previous.parent, previous.slot
//                         );
//                         slot_progress.println(&prev_root);

//                         let new_root = format!(
//                             "|  '- {} <- … <- {} <- {}   (next)",
//                             new_info.root, new_info.parent, new_info.slot
//                         );

//                         slot_progress.println(prev_root);
//                         slot_progress.println(new_root);
//                         slot_progress.println(spacer);
//                     }
//                 }
//                 current = Some(new_info);
//             }
//             Err(err) => {
//                 PgTerminal::log_wasm("disconnected: {}", err);
//                 break;
//             }
//         }
//     }

//     Ok("".to_string())
// }

// pub fn process_show_gossip(rpc_client: &WasmClient, config: &CliConfig<'_>) -> ProcessResult {
//     let cluster_nodes = rpc_client.get_cluster_nodes()?;

//     let nodes: Vec<_> = cluster_nodes
//         .into_iter()
//         .map(|node| CliGossipNode::new(node, &config.address_labels))
//         .collect();

//     Ok(config
//         .output_format
//         .formatted_string(&CliGossipNodes(nodes)))
// }

pub async fn process_show_stakes(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    use_lamports_unit: bool,
    vote_account_pubkeys: Option<&[Pubkey]>,
) -> ProcessResult {
    use crate::commands::stake::build_stake_state;

    let mut program_accounts_config = RpcProgramAccountsConfig {
        account_config: RpcAccountInfoConfig {
            encoding: Some(UiAccountEncoding::Base64),
            ..RpcAccountInfoConfig::default()
        },
        ..RpcProgramAccountsConfig::default()
    };

    if let Some(vote_account_pubkeys) = vote_account_pubkeys {
        // Use server-side filtering if only one vote account is provided
        if vote_account_pubkeys.len() == 1 {
            program_accounts_config.filters = Some(vec![
                // Filter by `StakeState::Stake(_, _)`
                RpcFilterType::Memcmp(Memcmp {
                    offset: 0,
                    bytes: MemcmpEncodedBytes::Base58(bs58::encode([2, 0, 0, 0]).into_string()),
                    encoding: Some(MemcmpEncoding::Binary),
                }),
                // Filter by `Delegation::voter_pubkey`, which begins at byte offset 124
                RpcFilterType::Memcmp(Memcmp {
                    offset: 124,
                    bytes: MemcmpEncodedBytes::Base58(vote_account_pubkeys[0].to_string()),
                    encoding: Some(MemcmpEncoding::Binary),
                }),
            ]);
        }
    }
    let all_stake_accounts = rpc_client
        .get_program_accounts_with_config(&stake::program::id(), program_accounts_config)
        .await?;
    let stake_history_account = rpc_client.get_account(&stake_history::id()).await?;
    let clock_account = rpc_client.get_account(&sysvar::clock::id()).await?;
    let clock: Clock = from_account(&clock_account).ok_or_else(|| {
        CliError::RpcRequestError("Failed to deserialize clock sysvar".to_string())
    })?;

    let stake_history = from_account(&stake_history_account).ok_or_else(|| {
        CliError::RpcRequestError("Failed to deserialize stake history".to_string())
    })?;

    let mut stake_accounts: Vec<CliKeyedStakeState> = vec![];
    for (stake_pubkey, stake_account) in all_stake_accounts {
        if let Ok(stake_state) = stake_account.state() {
            match stake_state {
                StakeStateV2::Initialized(_) => {
                    if vote_account_pubkeys.is_none() {
                        stake_accounts.push(CliKeyedStakeState {
                            stake_pubkey: stake_pubkey.to_string(),
                            stake_state: build_stake_state(
                                stake_account.lamports,
                                &stake_state,
                                use_lamports_unit,
                                &stake_history,
                                &clock,
                            ),
                        });
                    }
                }
                StakeStateV2::Stake(_, stake, _) => {
                    if vote_account_pubkeys.is_none()
                        || vote_account_pubkeys
                            .unwrap()
                            .contains(&stake.delegation.voter_pubkey)
                    {
                        stake_accounts.push(CliKeyedStakeState {
                            stake_pubkey: stake_pubkey.to_string(),
                            stake_state: build_stake_state(
                                stake_account.lamports,
                                &stake_state,
                                use_lamports_unit,
                                &stake_history,
                                &clock,
                            ),
                        });
                    }
                }
                _ => {}
            }
        }
    }
    Ok(config
        .output_format
        .formatted_string(&CliStakeVec::new(stake_accounts)))
}

// pub fn process_wait_for_max_stake(
//     rpc_client: &WasmClient,
//     config: &CliConfig<'_>,
//     max_stake_percent: f32,
// ) -> ProcessResult {
//     let now = std::time::Instant::now();
//     rpc_client.wait_for_max_stake(config.commitment, max_stake_percent)?;
//     Ok(format!("Done waiting, took: {}s", now.elapsed().as_secs()))
// }

#[allow(clippy::too_many_arguments)]
pub async fn process_show_validators(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    use_lamports_unit: bool,
    validators_sort_order: CliValidatorsSortOrder,
    validators_reverse_sort: bool,
    number_validators: bool,
    keep_unstaked_delinquents: bool,
    delinquent_slot_distance: Option<Slot>,
) -> ProcessResult {
    // let progress_bar = new_spinner_progress_bar();
    // progress_bar.set_message("Fetching vote accounts...");
    let epoch_info = rpc_client.get_epoch_info().await?;
    let vote_accounts = rpc_client
        .get_vote_accounts_with_config(RpcGetVoteAccountsConfig {
            keep_unstaked_delinquents: Some(keep_unstaked_delinquents),
            delinquent_slot_distance,
            ..RpcGetVoteAccountsConfig::default()
        })
        .await?;

    // progress_bar.set_message("Fetching block production...");
    let skip_rate: HashMap<_, _> = rpc_client
        .get_block_production()
        .await
        .ok()
        .map(|result| {
            result
                .by_identity
                .into_iter()
                .map(|(identity, (leader_slots, blocks_produced))| {
                    (
                        identity,
                        100. * (leader_slots.saturating_sub(blocks_produced)) as f64
                            / leader_slots as f64,
                    )
                })
                .collect()
        })
        .unwrap_or_default();

    // progress_bar.set_message("Fetching version information...");
    let mut node_version = HashMap::new();
    for contact_info in rpc_client.get_cluster_nodes().await? {
        node_version.insert(
            contact_info.pubkey,
            contact_info
                .version
                .and_then(|version| CliVersion::from_str(&version).ok())
                .unwrap_or_else(CliVersion::unknown_version),
        );
    }

    // progress_bar.finish_and_clear();

    let total_active_stake = vote_accounts
        .current
        .iter()
        .chain(vote_accounts.delinquent.iter())
        .map(|vote_account| vote_account.activated_stake)
        .sum();

    let total_delinquent_stake = vote_accounts
        .delinquent
        .iter()
        .map(|vote_account| vote_account.activated_stake)
        .sum();
    let total_current_stake = total_active_stake - total_delinquent_stake;

    let current_validators: Vec<CliValidator> = vote_accounts
        .current
        .iter()
        .map(|vote_account| {
            CliValidator::new(
                vote_account,
                epoch_info.epoch,
                node_version
                    .get(&vote_account.node_pubkey)
                    .cloned()
                    .unwrap_or_else(CliVersion::unknown_version),
                skip_rate.get(&vote_account.node_pubkey).cloned(),
                &config.address_labels,
            )
        })
        .collect();
    let delinquent_validators: Vec<CliValidator> = vote_accounts
        .delinquent
        .iter()
        .map(|vote_account| {
            CliValidator::new_delinquent(
                vote_account,
                epoch_info.epoch,
                node_version
                    .get(&vote_account.node_pubkey)
                    .cloned()
                    .unwrap_or_else(CliVersion::unknown_version),
                skip_rate.get(&vote_account.node_pubkey).cloned(),
                &config.address_labels,
            )
        })
        .collect();

    let mut stake_by_version: BTreeMap<CliVersion, CliValidatorsStakeByVersion> = BTreeMap::new();
    for validator in current_validators.iter() {
        let entry = stake_by_version
            .entry(validator.version.clone())
            .or_default();
        entry.current_validators += 1;
        entry.current_active_stake += validator.activated_stake;
    }
    for validator in delinquent_validators.iter() {
        let entry = stake_by_version
            .entry(validator.version.clone())
            .or_default();
        entry.delinquent_validators += 1;
        entry.delinquent_active_stake += validator.activated_stake;
    }

    let validators: Vec<_> = current_validators
        .into_iter()
        .chain(delinquent_validators.into_iter())
        .collect();

    let (average_skip_rate, average_stake_weighted_skip_rate) = {
        let mut skip_rate_len = 0;
        let mut skip_rate_sum = 0.;
        let mut skip_rate_weighted_sum = 0.;
        for validator in validators.iter() {
            if let Some(skip_rate) = validator.skip_rate {
                skip_rate_sum += skip_rate;
                skip_rate_len += 1;
                skip_rate_weighted_sum += skip_rate * validator.activated_stake as f64;
            }
        }

        if skip_rate_len > 0 && total_active_stake > 0 {
            (
                skip_rate_sum / skip_rate_len as f64,
                skip_rate_weighted_sum / total_active_stake as f64,
            )
        } else {
            (100., 100.) // Impossible?
        }
    };

    let cli_validators = CliValidators {
        total_active_stake,
        total_current_stake,
        total_delinquent_stake,
        validators,
        average_skip_rate,
        average_stake_weighted_skip_rate,
        validators_sort_order,
        validators_reverse_sort,
        number_validators,
        stake_by_version,
        use_lamports_unit,
    };
    Ok(config.output_format.formatted_string(&cli_validators))
}

pub async fn process_transaction_history(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    address: &Pubkey,
    before: Option<Signature>,
    until: Option<Signature>,
    limit: usize,
    show_transactions: bool,
) -> ProcessResult {
    let results = rpc_client
        .get_signatures_for_address_with_config(
            address,
            GetConfirmedSignaturesForAddress2Config {
                before,
                until,
                limit: Some(limit),
                commitment: Some(CommitmentConfig::confirmed()),
            },
        )
        .await?;

    let transactions_found = format!("{} transactions found", results.len());

    for result in results {
        if config.verbose {
            PgTerminal::log_wasm(&format!(
                "{} [slot={} {}status={}] {}",
                result.signature,
                result.slot,
                match result.block_time {
                    None => "".to_string(),
                    Some(block_time) => {
                        format!("timestamp={} ", unix_timestamp_to_string(block_time))
                    }
                },
                if let Some(err) = result.err {
                    format!("Failed: {:?}", err)
                } else {
                    match result.confirmation_status {
                        None => "Finalized".to_string(),
                        Some(status) => format!("{:?}", status),
                    }
                },
                result.memo.unwrap_or_default(),
            ));
        } else {
            PgTerminal::log_wasm(&result.signature.to_string());
        }

        if show_transactions {
            if let Ok(signature) = result.signature.parse::<Signature>() {
                match rpc_client
                    .get_transaction_with_config(
                        &signature,
                        RpcTransactionConfig {
                            encoding: Some(UiTransactionEncoding::Base64),
                            commitment: Some(CommitmentConfig::confirmed()),
                            max_supported_transaction_version: Some(0),
                        },
                    )
                    .await
                {
                    Ok(confirmed_transaction) => {
                        println_transaction(
                            &confirmed_transaction
                                .transaction
                                .transaction
                                .decode()
                                .expect("Successful decode"),
                            confirmed_transaction.transaction.meta.as_ref(),
                            "  ",
                            None,
                            None,
                        );
                    }
                    Err(err) => PgTerminal::log_wasm(&format!(
                        "  Unable to get confirmed transaction details: {}",
                        err
                    )),
                }
            }
            PgTerminal::log_wasm("");
        }
    }
    Ok(transactions_found)
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CliRentCalculation {
    pub lamports_per_byte_year: u64,
    pub lamports_per_epoch: u64,
    pub rent_exempt_minimum_lamports: u64,
    #[serde(skip)]
    pub use_lamports_unit: bool,
}

impl CliRentCalculation {
    fn build_balance_message(&self, lamports: u64) -> String {
        build_balance_message(lamports, self.use_lamports_unit, true)
    }
}

impl fmt::Display for CliRentCalculation {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let per_byte_year = self.build_balance_message(self.lamports_per_byte_year);
        let per_epoch = self.build_balance_message(self.lamports_per_epoch);
        let exempt_minimum = self.build_balance_message(self.rent_exempt_minimum_lamports);
        writeln_name_value(f, "Rent per byte-year:", &per_byte_year)?;
        writeln_name_value(f, "Rent per epoch:", &per_epoch)?;
        writeln_name_value(f, "Rent-exempt minimum:", &exempt_minimum)
    }
}

impl QuietDisplay for CliRentCalculation {}
impl VerboseDisplay for CliRentCalculation {}

#[derive(Debug, PartialEq, Eq)]
pub enum RentLengthValue {
    Nonce,
    Stake,
    System,
    Vote,
    Bytes(usize),
}

impl RentLengthValue {
    pub fn length(&self) -> usize {
        match self {
            Self::Nonce => NonceState::size(),
            Self::Stake => StakeStateV2::size_of(),
            Self::System => 0,
            Self::Vote => VoteState::size_of(),
            Self::Bytes(l) => *l,
        }
    }
}

#[derive(Debug, Error)]
#[error("expected number or moniker, got \"{0}\"")]
pub struct RentLengthValueError(pub String);

impl FromStr for RentLengthValue {
    type Err = RentLengthValueError;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let s = s.to_ascii_lowercase();
        match s.as_str() {
            "nonce" => Ok(Self::Nonce),
            "stake" => Ok(Self::Stake),
            "system" => Ok(Self::System),
            "vote" => Ok(Self::Vote),
            _ => usize::from_str(&s)
                .map(Self::Bytes)
                .map_err(|_| RentLengthValueError(s)),
        }
    }
}

pub async fn process_calculate_rent(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    data_length: usize,
    use_lamports_unit: bool,
) -> ProcessResult {
    let epoch_schedule = rpc_client.get_epoch_schedule().await?;
    let rent_account = rpc_client.get_account(&sysvar::rent::id()).await?;
    let rent: Rent = rent_account.deserialize_data()?;
    let rent_exempt_minimum_lamports = rent.minimum_balance(data_length);
    let seconds_per_tick = Duration::from_secs_f64(1.0 / clock::DEFAULT_TICKS_PER_SECOND as f64);
    let slots_per_year =
        timing::years_as_slots(1.0, &seconds_per_tick, clock::DEFAULT_TICKS_PER_SLOT);
    let slots_per_epoch = epoch_schedule.slots_per_epoch as f64;
    let years_per_epoch = slots_per_epoch / slots_per_year;
    let lamports_per_epoch = rent.due(0, data_length, years_per_epoch).lamports();
    let cli_rent_calculation = CliRentCalculation {
        lamports_per_byte_year: rent.lamports_per_byte_year,
        lamports_per_epoch,
        rent_exempt_minimum_lamports,
        use_lamports_unit,
    };

    Ok(config.output_format.formatted_string(&cli_rent_calculation))
}
