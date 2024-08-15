use std::{ops::Deref, rc::Rc};

use clap::{Arg, ArgMatches, Command};
use solana_clap_v3_utils_wasm::{input_parsers::*, input_validators::*};
use solana_cli_output_wasm::cli_output::{
    CliEpochReward, CliStakeHistory, CliStakeHistoryEntry, CliStakeState, CliStakeType,
    OutputFormat,
};
use solana_client_wasm::{utils::rpc_response::RpcInflationReward, WasmClient};
use solana_playground_utils_wasm::js::PgTerminal;
use solana_remote_wallet::remote_wallet::RemoteWalletManager;
use solana_sdk::{
    account::from_account,
    account_utils::StateMut,
    clock::{Clock, UnixTimestamp, SECONDS_PER_DAY},
    epoch_schedule::EpochSchedule,
    pubkey::Pubkey,
    stake::{
        self,
        state::{Meta, StakeActivationStatus, StakeStateV2},
    },
    stake_history::StakeHistory,
    sysvar::{clock, stake_history},
};

use crate::cli::{CliCommand, CliCommandInfo, CliConfig, CliError, ProcessResult};

// pub const STAKE_AUTHORITY_ARG: ArgConstant<'static> = ArgConstant {
//     name: "stake_authority",
//     long: "stake-authority",
//     help: "Authorized staker [default: cli config keypair]",
// };

// pub const WITHDRAW_AUTHORITY_ARG: ArgConstant<'static> = ArgConstant {
//     name: "withdraw_authority",
//     long: "withdraw-authority",
//     help: "Authorized withdrawer [default: cli config keypair]",
// };

// pub const CUSTODIAN_ARG: ArgConstant<'static> = ArgConstant {
//     name: "custodian",
//     long: "custodian",
//     help: "Authority to override account lockup",
// };

// fn stake_authority_arg<'a, 'b>() -> Arg<'a, 'b> {
//     Arg::new(STAKE_AUTHORITY_ARG.name)
//         .long(STAKE_AUTHORITY_ARG.long)
//         .takes_value(true)
//         .value_name("KEYPAIR")
//         .validator(is_valid_signer)
//         .help(STAKE_AUTHORITY_ARG.help)
// }

// fn withdraw_authority_arg<'a, 'b>() -> Arg<'a, 'b> {
//     Arg::new(WITHDRAW_AUTHORITY_ARG.name)
//         .long(WITHDRAW_AUTHORITY_ARG.long)
//         .takes_value(true)
//         .value_name("KEYPAIR")
//         .validator(is_valid_signer)
//         .help(WITHDRAW_AUTHORITY_ARG.help)
// }

// fn custodian_arg<'a, 'b>() -> Arg<'a, 'b> {
//     Arg::new(CUSTODIAN_ARG.name)
//         .long(CUSTODIAN_ARG.long)
//         .takes_value(true)
//         .value_name("KEYPAIR")
//         .validator(is_valid_signer)
//         .help(CUSTODIAN_ARG.help)
// }

// pub(crate) struct StakeAuthorization {
//     authorization_type: StakeAuthorize,
//     new_authority_pubkey: Pubkey,
//     authority_pubkey: Option<Pubkey>,
// }

// #[derive(Debug, PartialEq, Eq)]
// pub struct StakeAuthorizationIndexed {
//     pub authorization_type: StakeAuthorize,
//     pub new_authority_pubkey: Pubkey,
//     pub authority: SignerIndex,
//     pub new_authority_signer: Option<SignerIndex>,
// }

pub trait StakeSubCommands {
    fn stake_subcommands(self) -> Self;
}

impl StakeSubCommands for Command<'_> {
    fn stake_subcommands(self) -> Self {
        //         self.subcommand(
        //             Command::new("create-stake-account")
        //                 .about("Create a stake account")
        //                 .arg(
        //                     Arg::new("stake_account")
        //                         .index(1)
        //                         .value_name("STAKE_ACCOUNT_KEYPAIR")
        //                         .takes_value(true)
        //                         .required(true)
        //                         .validator(is_valid_signer)
        //                         .help("Stake account to create (or base of derived address if --seed is used)")
        //                 )
        //                 .arg(
        //                     Arg::new("amount")
        //                         .index(2)
        //                         .value_name("AMOUNT")
        //                         .takes_value(true)
        //                         .validator(is_amount_or_all)
        //                         .required(true)
        //                         .help("The amount to send to the stake account, in SOL; accepts keyword ALL")
        //                 )
        //                 .arg(
        //                     pubkey!(Arg::new("custodian")
        //                         .long("custodian")
        //                         .value_name("PUBKEY"),
        //                         "Authority to modify lockups. ")
        //                 )
        //                 .arg(
        //                     Arg::new("seed")
        //                         .long("seed")
        //                         .value_name("STRING")
        //                         .takes_value(true)
        //                         .help("Seed for address generation; if specified, the resulting account \
        //                                will be at a derived address of the STAKE_ACCOUNT_KEYPAIR pubkey")
        //                 )
        //                 .arg(
        //                     Arg::new("lockup_epoch")
        //                         .long("lockup-epoch")
        //                         .value_name("NUMBER")
        //                         .takes_value(true)
        //                         .help("The epoch height at which this account will be available for withdrawal")
        //                 )
        //                 .arg(
        //                     Arg::new("lockup_date")
        //                         .long("lockup-date")
        //                         .value_name("RFC3339 DATETIME")
        //                         .validator(is_rfc3339_datetime)
        //                         .takes_value(true)
        //                         .help("The date and time at which this account will be available for withdrawal")
        //                 )
        //                 .arg(
        //                     Arg::new(STAKE_AUTHORITY_ARG.name)
        //                         .long(STAKE_AUTHORITY_ARG.long)
        //                         .value_name("PUBKEY")
        //                         .takes_value(true)
        //                         .validator(is_valid_pubkey)
        //                         .help(STAKE_AUTHORITY_ARG.help)
        //                 )
        //                 .arg(
        //                     Arg::new(WITHDRAW_AUTHORITY_ARG.name)
        //                         .long(WITHDRAW_AUTHORITY_ARG.long)
        //                         .value_name("PUBKEY")
        //                         .takes_value(true)
        //                         .validator(is_valid_pubkey)
        //                         .help(WITHDRAW_AUTHORITY_ARG.help)
        //                 )
        //                 .arg(
        //                     Arg::new("from")
        //                         .long("from")
        //                         .takes_value(true)
        //                         .value_name("KEYPAIR")
        //                         .validator(is_valid_signer)
        //                         .help("Source account of funds [default: cli config keypair]"),
        //                 )
        //                 .offline_args()
        //                 .nonce_args(false)
        //                 .arg(fee_payer_arg())
        //                 .arg(memo_arg())
        //         )
        //         .subcommand(
        //             Command::new("create-stake-account-checked")
        //                 .about("Create a stake account, checking the withdraw authority as a signer")
        //                 .arg(
        //                     Arg::new("stake_account")
        //                         .index(1)
        //                         .value_name("STAKE_ACCOUNT_KEYPAIR")
        //                         .takes_value(true)
        //                         .required(true)
        //                         .validator(is_valid_signer)
        //                         .help("Stake account to create (or base of derived address if --seed is used)")
        //                 )
        //                 .arg(
        //                     Arg::new("amount")
        //                         .index(2)
        //                         .value_name("AMOUNT")
        //                         .takes_value(true)
        //                         .validator(is_amount_or_all)
        //                         .required(true)
        //                         .help("The amount to send to the stake account, in SOL; accepts keyword ALL")
        //                 )
        //                 .arg(
        //                     Arg::new("seed")
        //                         .long("seed")
        //                         .value_name("STRING")
        //                         .takes_value(true)
        //                         .help("Seed for address generation; if specified, the resulting account \
        //                                will be at a derived address of the STAKE_ACCOUNT_KEYPAIR pubkey")
        //                 )
        //                 .arg(
        //                     Arg::new(STAKE_AUTHORITY_ARG.name)
        //                         .long(STAKE_AUTHORITY_ARG.long)
        //                         .value_name("PUBKEY")
        //                         .takes_value(true)
        //                         .validator(is_valid_pubkey)
        //                         .help(STAKE_AUTHORITY_ARG.help)
        //                 )
        //                 .arg(
        //                     Arg::new(WITHDRAW_AUTHORITY_ARG.name)
        //                         .long(WITHDRAW_AUTHORITY_ARG.long)
        //                         .value_name("KEYPAIR")
        //                         .takes_value(true)
        //                         .validator(is_valid_signer)
        //                         .help(WITHDRAW_AUTHORITY_ARG.help)
        //                 )
        //                 .arg(
        //                     Arg::new("from")
        //                         .long("from")
        //                         .takes_value(true)
        //                         .value_name("KEYPAIR")
        //                         .validator(is_valid_signer)
        //                         .help("Source account of funds [default: cli config keypair]"),
        //                 )
        //                 .offline_args()
        //                 .nonce_args(false)
        //                 .arg(fee_payer_arg())
        //                 .arg(memo_arg())
        //         )
        //         .subcommand(
        //             Command::new("delegate-stake")
        //                 .about("Delegate stake to a vote account")
        //                 .arg(
        //                     Arg::new("force")
        //                         .long("force")
        //                         .takes_value(false)
        //                         .hidden(true) // Don't document this argument to discourage its use
        //                         .help("Override vote account sanity checks (use carefully!)")
        //                 )
        //                 .arg(
        //                     pubkey!(Arg::new("stake_account_pubkey")
        //                         .index(1)
        //                         .value_name("STAKE_ACCOUNT_ADDRESS")
        //                         .required(true),
        //                         "Stake account to delegate")
        //                 )
        //                 .arg(
        //                     pubkey!(Arg::new("vote_account_pubkey")
        //                         .index(2)
        //                         .value_name("VOTE_ACCOUNT_ADDRESS")
        //                         .required(true),
        //                         "The vote account to which the stake will be delegated")
        //                 )
        //                 .arg(stake_authority_arg())
        //                 .offline_args()
        //                 .nonce_args(false)
        //                 .arg(fee_payer_arg())
        //                 .arg(memo_arg())
        //         )
        //         .subcommand(
        //             Command::new("stake-authorize")
        //                 .about("Authorize a new signing keypair for the given stake account")
        //                 .arg(
        //                     pubkey!(Arg::new("stake_account_pubkey")
        //                         .required(true)
        //                         .index(1)
        //                         .value_name("STAKE_ACCOUNT_ADDRESS"),
        //                         "Stake account in which to set a new authority. ")
        //                 )
        //                 .arg(
        //                     pubkey!(Arg::new("new_stake_authority")
        //                         .long("new-stake-authority")
        //                         .required_unless("new_withdraw_authority")
        //                         .value_name("PUBKEY"),
        //                         "New authorized staker")
        //                 )
        //                 .arg(
        //                     pubkey!(Arg::new("new_withdraw_authority")
        //                         .long("new-withdraw-authority")
        //                         .required_unless("new_stake_authority")
        //                         .value_name("PUBKEY"),
        //                         "New authorized withdrawer. ")
        //                 )
        //                 .arg(stake_authority_arg())
        //                 .arg(withdraw_authority_arg())
        //                 .offline_args()
        //                 .nonce_args(false)
        //                 .arg(fee_payer_arg())
        //                 .arg(custodian_arg())
        //                 .arg(
        //                     Arg::new("no_wait")
        //                         .long("no-wait")
        //                         .takes_value(false)
        //                         .help("Return signature immediately after submitting the transaction, instead of waiting for confirmations"),
        //                 )
        //                 .arg(memo_arg())
        //         )
        //         .subcommand(
        //             Command::new("stake-authorize-checked")
        //                 .about("Authorize a new signing keypair for the given stake account, checking the authority as a signer")
        //                 .arg(
        //                     pubkey!(Arg::new("stake_account_pubkey")
        //                         .required(true)
        //                         .index(1)
        //                         .value_name("STAKE_ACCOUNT_ADDRESS"),
        //                         "Stake account in which to set a new authority. ")
        //                 )
        //                 .arg(
        //                     Arg::new("new_stake_authority")
        //                         .long("new-stake-authority")
        //                         .value_name("KEYPAIR")
        //                         .takes_value(true)
        //                         .validator(is_valid_signer)
        //                         .help("New authorized staker")
        //                 )
        //                 .arg(
        //                     Arg::new("new_withdraw_authority")
        //                         .long("new-withdraw-authority")
        //                         .value_name("KEYPAIR")
        //                         .takes_value(true)
        //                         .validator(is_valid_signer)
        //                         .help("New authorized withdrawer")
        //                 )
        //                 .arg(stake_authority_arg())
        //                 .arg(withdraw_authority_arg())
        //                 .offline_args()
        //                 .nonce_args(false)
        //                 .arg(fee_payer_arg())
        //                 .arg(custodian_arg())
        //                 .arg(
        //                     Arg::new("no_wait")
        //                         .long("no-wait")
        //                         .takes_value(false)
        //                         .help("Return signature immediately after submitting the transaction, instead of waiting for confirmations"),
        //                 )
        //                 .arg(memo_arg())
        //         )
        //         .subcommand(
        //             Command::new("deactivate-stake")
        //                 .about("Deactivate the delegated stake from the stake account")
        //                 .arg(
        //                     pubkey!(Arg::new("stake_account_pubkey")
        //                         .index(1)
        //                         .value_name("STAKE_ACCOUNT_ADDRESS")
        //                         .required(true),
        //                         "Stake account to be deactivated (or base of derived address if --seed is used). ")
        //                 )
        //                 .arg(
        //                     Arg::new("seed")
        //                         .long("seed")
        //                         .value_name("STRING")
        //                         .takes_value(true)
        //                         .help("Seed for address generation; if specified, the resulting account \
        //                                will be at a derived address of STAKE_ACCOUNT_ADDRESS")
        //                 )
        //                 .arg(
        //                     Arg::new("delinquent")
        //                         .long("delinquent")
        //                         .takes_value(false)
        //                         .conflicts_with(SIGN_ONLY_ARG.name)
        //                         .help("Deactivate abandoned stake that is currently delegated to a delinquent vote account")
        //                 )
        //                 .arg(stake_authority_arg())
        //                 .offline_args()
        //                 .nonce_args(false)
        //                 .arg(fee_payer_arg())
        //                 .arg(memo_arg())
        //         )
        //         .subcommand(
        //             Command::new("split-stake")
        //                 .about("Duplicate a stake account, splitting the tokens between the two")
        //                 .arg(
        //                     pubkey!(Arg::new("stake_account_pubkey")
        //                         .index(1)
        //                         .value_name("STAKE_ACCOUNT_ADDRESS")
        //                         .required(true),
        //                         "Stake account to split (or base of derived address if --seed is used). ")
        //                 )
        //                 .arg(
        //                     Arg::new("split_stake_account")
        //                         .index(2)
        //                         .value_name("SPLIT_STAKE_ACCOUNT")
        //                         .takes_value(true)
        //                         .required(true)
        //                         .validator(is_valid_signer)
        //                         .help("Keypair of the new stake account")
        //                 )
        //                 .arg(
        //                     Arg::new("amount")
        //                         .index(3)
        //                         .value_name("AMOUNT")
        //                         .takes_value(true)
        //                         .validator(is_amount)
        //                         .required(true)
        //                         .help("The amount to move into the new stake account, in SOL")
        //                 )
        //                 .arg(
        //                     Arg::new("seed")
        //                         .long("seed")
        //                         .value_name("STRING")
        //                         .takes_value(true)
        //                         .help("Seed for address generation; if specified, the resulting account \
        //                                will be at a derived address of SPLIT_STAKE_ACCOUNT")
        //                 )
        //                 .arg(stake_authority_arg())
        //                 .offline_args()
        //                 .nonce_args(false)
        //                 .arg(fee_payer_arg())
        //                 .arg(memo_arg())
        //         )
        //         .subcommand(
        //             Command::new("merge-stake")
        //                 .about("Merges one stake account into another")
        //                 .arg(
        //                     pubkey!(Arg::new("stake_account_pubkey")
        //                         .index(1)
        //                         .value_name("STAKE_ACCOUNT_ADDRESS")
        //                         .required(true),
        //                         "Stake account to merge into")
        //                 )
        //                 .arg(
        //                     pubkey!(Arg::new("source_stake_account_pubkey")
        //                         .index(2)
        //                         .value_name("SOURCE_STAKE_ACCOUNT_ADDRESS")
        //                         .required(true),
        //                         "Source stake account for the merge.  If successful, this stake account \
        //                          will no longer exist after the merge")
        //                 )
        //                 .arg(stake_authority_arg())
        //                 .offline_args()
        //                 .nonce_args(false)
        //                 .arg(fee_payer_arg())
        //                 .arg(memo_arg())
        //         )
        //         .subcommand(
        //             Command::new("withdraw-stake")
        //                 .about("Withdraw the unstaked SOL from the stake account")
        //                 .arg(
        //                     pubkey!(Arg::new("stake_account_pubkey")
        //                         .index(1)
        //                         .value_name("STAKE_ACCOUNT_ADDRESS")
        //                         .required(true),
        //                         "Stake account from which to withdraw (or base of derived address if --seed is used). ")
        //                 )
        //                 .arg(
        //                     pubkey!(Arg::new("destination_account_pubkey")
        //                         .index(2)
        //                         .value_name("RECIPIENT_ADDRESS")
        //                         .required(true),
        //                         "Recipient of withdrawn SOL")
        //                 )
        //                 .arg(
        //                     Arg::new("amount")
        //                         .index(3)
        //                         .value_name("AMOUNT")
        //                         .takes_value(true)
        //                         .validator(is_amount_or_all)
        //                         .required(true)
        //                         .help("The amount to withdraw from the stake account, in SOL; accepts keyword ALL")
        //                 )
        //                 .arg(
        //                     Arg::new("seed")
        //                         .long("seed")
        //                         .value_name("STRING")
        //                         .takes_value(true)
        //                         .help("Seed for address generation; if specified, the resulting account \
        //                                will be at a derived address of STAKE_ACCOUNT_ADDRESS")
        //                 )
        //                 .arg(withdraw_authority_arg())
        //                 .offline_args()
        //                 .nonce_args(false)
        //                 .arg(fee_payer_arg())
        //                 .arg(custodian_arg())
        //                 .arg(memo_arg())
        //         )
        //         .subcommand(
        //             Command::new("stake-set-lockup")
        //                 .about("Set Lockup for the stake account")
        //                 .arg(
        //                     pubkey!(Arg::new("stake_account_pubkey")
        //                         .index(1)
        //                         .value_name("STAKE_ACCOUNT_ADDRESS")
        //                         .required(true),
        //                         "Stake account for which to set lockup parameters. ")
        //                 )
        //                 .arg(
        //                     Arg::new("lockup_epoch")
        //                         .long("lockup-epoch")
        //                         .value_name("NUMBER")
        //                         .takes_value(true)
        //                         .help("The epoch height at which this account will be available for withdrawal")
        //                 )
        //                 .arg(
        //                     Arg::new("lockup_date")
        //                         .long("lockup-date")
        //                         .value_name("RFC3339 DATETIME")
        //                         .validator(is_rfc3339_datetime)
        //                         .takes_value(true)
        //                         .help("The date and time at which this account will be available for withdrawal")
        //                 )
        //                 .arg(
        //                     pubkey!(Arg::new("new_custodian")
        //                         .long("new-custodian")
        //                         .value_name("PUBKEY"),
        //                         "Identity of a new lockup custodian. ")
        //                 )
        //                 .group(ArgGroup::with_name("lockup_details")
        //                     .args(&["lockup_epoch", "lockup_date", "new_custodian"])
        //                     .multiple(true)
        //                     .required(true))
        //                 .arg(
        //                     Arg::new("custodian")
        //                         .long("custodian")
        //                         .takes_value(true)
        //                         .value_name("KEYPAIR")
        //                         .validator(is_valid_signer)
        //                         .help("Keypair of the existing custodian [default: cli config pubkey]")
        //                 )
        //                 .offline_args()
        //                 .nonce_args(false)
        //                 .arg(fee_payer_arg())
        //                 .arg(memo_arg())
        //         )
        //         .subcommand(
        //             Command::new("stake-set-lockup-checked")
        //                 .about("Set Lockup for the stake account, checking the new authority as a signer")
        //                 .arg(
        //                     pubkey!(Arg::new("stake_account_pubkey")
        //                         .index(1)
        //                         .value_name("STAKE_ACCOUNT_ADDRESS")
        //                         .required(true),
        //                         "Stake account for which to set lockup parameters. ")
        //                 )
        //                 .arg(
        //                     Arg::new("lockup_epoch")
        //                         .long("lockup-epoch")
        //                         .value_name("NUMBER")
        //                         .takes_value(true)
        //                         .help("The epoch height at which this account will be available for withdrawal")
        //                 )
        //                 .arg(
        //                     Arg::new("lockup_date")
        //                         .long("lockup-date")
        //                         .value_name("RFC3339 DATETIME")
        //                         .validator(is_rfc3339_datetime)
        //                         .takes_value(true)
        //                         .help("The date and time at which this account will be available for withdrawal")
        //                 )
        //                 .arg(
        //                     Arg::new("new_custodian")
        //                         .long("new-custodian")
        //                         .value_name("KEYPAIR")
        //                         .takes_value(true)
        //                         .validator(is_valid_signer)
        //                         .help("Keypair of a new lockup custodian")
        //                 )
        //                 .group(ArgGroup::with_name("lockup_details")
        //                     .args(&["lockup_epoch", "lockup_date", "new_custodian"])
        //                     .multiple(true)
        //                     .required(true))
        //                 .arg(
        //                     Arg::new("custodian")
        //                         .long("custodian")
        //                         .takes_value(true)
        //                         .value_name("KEYPAIR")
        //                         .validator(is_valid_signer)
        //                         .help("Keypair of the existing custodian [default: cli config pubkey]")
        //                 )
        //                 .offline_args()
        //                 .nonce_args(false)
        //                 .arg(fee_payer_arg())
        //                 .arg(memo_arg())
        //         )
        self.subcommand(
            Command::new("stake-account")
                .about("Show the contents of a stake account")
                .alias("show-stake-account")
                .arg(
                    pubkey!(Arg::new("stake_account_pubkey")
                        .index(1)
                        .value_name("STAKE_ACCOUNT_ADDRESS")
                        .required(true),
                        "The stake account to display. ")
                )
                .arg(
                    Arg::new("lamports")
                        .long("lamports")
                        .takes_value(false)
                        .help("Display balance in lamports instead of SOL")
                )
                .arg(
                    Arg::new("with_rewards")
                        .long("with-rewards")
                        .takes_value(false)
                        .help("Display inflation rewards"),
                )
                .arg(
                    Arg::new("num_rewards_epochs")
                        .long("num-rewards-epochs")
                        .takes_value(true)
                        .value_name("NUM")
                        .validator(|s| is_within_range(s, 1, 10))
                        .default_value_if("with_rewards", None, Some("1"))
                        .requires("with_rewards")
                        .help("Display rewards for NUM recent epochs, max 10 [default: latest epoch only]"),
                ),
        )
        .subcommand(
            Command::new("stake-history")
                .about("Show the stake history")
                .alias("show-stake-history")
                .arg(
                    Arg::new("lamports")
                        .long("lamports")
                        .takes_value(false)
                        .help("Display balance in lamports instead of SOL")
                )
                .arg(
                    Arg::new("limit")
                        .long("limit")
                        .takes_value(true)
                        .value_name("NUM")
                        .default_value("10")
                        .validator(|s| {
                            s.parse::<usize>()
                                .map(|_| ())
                                .map_err(|e| e.to_string())
                        })
                        .help("Display NUM recent epochs worth of stake history in text mode. 0 for all")
                )
        )
    }
}

// pub fn parse_create_stake_account(
//     matches: &ArgMatches,
//     default_signer: &DefaultSigner,
//     wallet_manager: &mut Option<Arc<RemoteWalletManager>>,
//     checked: bool,
// ) -> Result<CliCommandInfo, CliError> {
//     let seed = matches.value_of("seed").map(|s| s.to_string());
//     let epoch = value_of(matches, "lockup_epoch").unwrap_or(0);
//     let unix_timestamp = unix_timestamp_from_rfc3339_datetime(matches, "lockup_date").unwrap_or(0);
//     let custodian = pubkey_of_signer(matches, "custodian", wallet_manager)?.unwrap_or_default();
//     let staker = pubkey_of_signer(matches, STAKE_AUTHORITY_ARG.name, wallet_manager)?;

//     let (withdrawer_signer, withdrawer) = if checked {
//         signer_of(matches, WITHDRAW_AUTHORITY_ARG.name, wallet_manager)?
//     } else {
//         (
//             None,
//             pubkey_of_signer(matches, WITHDRAW_AUTHORITY_ARG.name, wallet_manager)?,
//         )
//     };

//     let amount = SpendAmount::new_from_matches(matches, "amount");
//     let sign_only = matches.is_present(SIGN_ONLY_ARG.name);
//     let dump_transaction_message = matches.is_present(DUMP_TRANSACTION_MESSAGE.name);
//     let blockhash_query = BlockhashQuery::new_from_matches(matches);
//     let nonce_account = pubkey_of_signer(matches, NONCE_ARG.name, wallet_manager)?;
//     let memo = matches.value_of(MEMO_ARG.name).map(String::from);
//     let (nonce_authority, nonce_authority_pubkey) =
//         signer_of(matches, NONCE_AUTHORITY_ARG.name, wallet_manager)?;
//     let (fee_payer, fee_payer_pubkey) = signer_of(matches, FEE_PAYER_ARG.name, wallet_manager)?;
//     let (from, from_pubkey) = signer_of(matches, "from", wallet_manager)?;
//     let (stake_account, stake_account_pubkey) =
//         signer_of(matches, "stake_account", wallet_manager)?;

//     let mut bulk_signers = vec![fee_payer, from, stake_account];
//     if nonce_account.is_some() {
//         bulk_signers.push(nonce_authority);
//     }
//     if withdrawer_signer.is_some() {
//         bulk_signers.push(withdrawer_signer);
//     }
//     let signer_info =
//         default_signer.generate_unique_signers(bulk_signers, matches, wallet_manager)?;

//     Ok(CliCommandInfo {
//         command: CliCommand::CreateStakeAccount {
//             stake_account: signer_info.index_of(stake_account_pubkey).unwrap(),
//             seed,
//             staker,
//             withdrawer,
//             withdrawer_signer: if checked {
//                 signer_info.index_of(withdrawer)
//             } else {
//                 None
//             },
//             lockup: Lockup {
//                 unix_timestamp,
//                 epoch,
//                 custodian,
//             },
//             amount,
//             sign_only,
//             dump_transaction_message,
//             blockhash_query,
//             nonce_account,
//             nonce_authority: signer_info.index_of(nonce_authority_pubkey).unwrap(),
//             memo,
//             fee_payer: signer_info.index_of(fee_payer_pubkey).unwrap(),
//             from: signer_info.index_of(from_pubkey).unwrap(),
//         },
//         signers: signer_info.signers,
//     })
// }

// pub fn parse_stake_delegate_stake(
//     matches: &ArgMatches,
//     default_signer: &DefaultSigner,
//     wallet_manager: &mut Option<Arc<RemoteWalletManager>>,
// ) -> Result<CliCommandInfo, CliError> {
//     let stake_account_pubkey =
//         pubkey_of_signer(matches, "stake_account_pubkey", wallet_manager)?.unwrap();
//     let vote_account_pubkey =
//         pubkey_of_signer(matches, "vote_account_pubkey", wallet_manager)?.unwrap();
//     let force = matches.is_present("force");
//     let sign_only = matches.is_present(SIGN_ONLY_ARG.name);
//     let dump_transaction_message = matches.is_present(DUMP_TRANSACTION_MESSAGE.name);
//     let blockhash_query = BlockhashQuery::new_from_matches(matches);
//     let nonce_account = pubkey_of(matches, NONCE_ARG.name);
//     let memo = matches.value_of(MEMO_ARG.name).map(String::from);
//     let (stake_authority, stake_authority_pubkey) =
//         signer_of(matches, STAKE_AUTHORITY_ARG.name, wallet_manager)?;
//     let (nonce_authority, nonce_authority_pubkey) =
//         signer_of(matches, NONCE_AUTHORITY_ARG.name, wallet_manager)?;
//     let (fee_payer, fee_payer_pubkey) = signer_of(matches, FEE_PAYER_ARG.name, wallet_manager)?;

//     let mut bulk_signers = vec![stake_authority, fee_payer];
//     if nonce_account.is_some() {
//         bulk_signers.push(nonce_authority);
//     }
//     let signer_info =
//         default_signer.generate_unique_signers(bulk_signers, matches, wallet_manager)?;

//     Ok(CliCommandInfo {
//         command: CliCommand::DelegateStake {
//             stake_account_pubkey,
//             vote_account_pubkey,
//             stake_authority: signer_info.index_of(stake_authority_pubkey).unwrap(),
//             force,
//             sign_only,
//             dump_transaction_message,
//             blockhash_query,
//             nonce_account,
//             nonce_authority: signer_info.index_of(nonce_authority_pubkey).unwrap(),
//             memo,
//             fee_payer: signer_info.index_of(fee_payer_pubkey).unwrap(),
//         },
//         signers: signer_info.signers,
//     })
// }

// pub fn parse_stake_authorize(
//     matches: &ArgMatches,
//     default_signer: &DefaultSigner,
//     wallet_manager: &mut Option<Arc<RemoteWalletManager>>,
//     checked: bool,
// ) -> Result<CliCommandInfo, CliError> {
//     let stake_account_pubkey =
//         pubkey_of_signer(matches, "stake_account_pubkey", wallet_manager)?.unwrap();

//     let mut new_authorizations = Vec::new();
//     let mut bulk_signers = Vec::new();

//     let (new_staker_signer, new_staker) = if checked {
//         signer_of(matches, "new_stake_authority", wallet_manager)?
//     } else {
//         (
//             None,
//             pubkey_of_signer(matches, "new_stake_authority", wallet_manager)?,
//         )
//     };

//     if let Some(new_authority_pubkey) = new_staker {
//         let (authority, authority_pubkey) = {
//             let (authority, authority_pubkey) =
//                 signer_of(matches, STAKE_AUTHORITY_ARG.name, wallet_manager)?;
//             // Withdraw authority may also change the staker
//             if authority.is_none() {
//                 signer_of(matches, WITHDRAW_AUTHORITY_ARG.name, wallet_manager)?
//             } else {
//                 (authority, authority_pubkey)
//             }
//         };
//         new_authorizations.push(StakeAuthorization {
//             authorization_type: StakeAuthorize::Staker,
//             new_authority_pubkey,
//             authority_pubkey,
//         });
//         bulk_signers.push(authority);
//         if new_staker.is_some() {
//             bulk_signers.push(new_staker_signer);
//         }
//     };

//     let (new_withdrawer_signer, new_withdrawer) = if checked {
//         signer_of(matches, "new_withdraw_authority", wallet_manager)?
//     } else {
//         (
//             None,
//             pubkey_of_signer(matches, "new_withdraw_authority", wallet_manager)?,
//         )
//     };

//     if let Some(new_authority_pubkey) = new_withdrawer {
//         let (authority, authority_pubkey) =
//             signer_of(matches, WITHDRAW_AUTHORITY_ARG.name, wallet_manager)?;
//         new_authorizations.push(StakeAuthorization {
//             authorization_type: StakeAuthorize::Withdrawer,
//             new_authority_pubkey,
//             authority_pubkey,
//         });
//         bulk_signers.push(authority);
//         if new_withdrawer_signer.is_some() {
//             bulk_signers.push(new_withdrawer_signer);
//         }
//     };
//     let sign_only = matches.is_present(SIGN_ONLY_ARG.name);
//     let dump_transaction_message = matches.is_present(DUMP_TRANSACTION_MESSAGE.name);
//     let blockhash_query = BlockhashQuery::new_from_matches(matches);
//     let nonce_account = pubkey_of(matches, NONCE_ARG.name);
//     let memo = matches.value_of(MEMO_ARG.name).map(String::from);
//     let (nonce_authority, nonce_authority_pubkey) =
//         signer_of(matches, NONCE_AUTHORITY_ARG.name, wallet_manager)?;
//     let (fee_payer, fee_payer_pubkey) = signer_of(matches, FEE_PAYER_ARG.name, wallet_manager)?;
//     let (custodian, custodian_pubkey) = signer_of(matches, "custodian", wallet_manager)?;
//     let no_wait = matches.is_present("no_wait");

//     bulk_signers.push(fee_payer);
//     if nonce_account.is_some() {
//         bulk_signers.push(nonce_authority);
//     }
//     if custodian.is_some() {
//         bulk_signers.push(custodian);
//     }
//     let signer_info =
//         default_signer.generate_unique_signers(bulk_signers, matches, wallet_manager)?;

//     let new_authorizations = new_authorizations
//         .into_iter()
//         .map(
//             |StakeAuthorization {
//                  authorization_type,
//                  new_authority_pubkey,
//                  authority_pubkey,
//              }| {
//                 StakeAuthorizationIndexed {
//                     authorization_type,
//                     new_authority_pubkey,
//                     authority: signer_info.index_of(authority_pubkey).unwrap(),
//                     new_authority_signer: signer_info.index_of(Some(new_authority_pubkey)),
//                 }
//             },
//         )
//         .collect();

//     Ok(CliCommandInfo {
//         command: CliCommand::StakeAuthorize {
//             stake_account_pubkey,
//             new_authorizations,
//             sign_only,
//             dump_transaction_message,
//             blockhash_query,
//             nonce_account,
//             nonce_authority: signer_info.index_of(nonce_authority_pubkey).unwrap(),
//             memo,
//             fee_payer: signer_info.index_of(fee_payer_pubkey).unwrap(),
//             custodian: custodian_pubkey.and_then(|_| signer_info.index_of(custodian_pubkey)),
//             no_wait,
//         },
//         signers: signer_info.signers,
//     })
// }

// pub fn parse_split_stake(
//     matches: &ArgMatches,
//     default_signer: &DefaultSigner,
//     wallet_manager: &mut Option<Arc<RemoteWalletManager>>,
// ) -> Result<CliCommandInfo, CliError> {
//     let stake_account_pubkey =
//         pubkey_of_signer(matches, "stake_account_pubkey", wallet_manager)?.unwrap();
//     let (split_stake_account, split_stake_account_pubkey) =
//         signer_of(matches, "split_stake_account", wallet_manager)?;
//     let lamports = lamports_of_sol(matches, "amount").unwrap();
//     let seed = matches.value_of("seed").map(|s| s.to_string());

//     let sign_only = matches.is_present(SIGN_ONLY_ARG.name);
//     let dump_transaction_message = matches.is_present(DUMP_TRANSACTION_MESSAGE.name);
//     let blockhash_query = BlockhashQuery::new_from_matches(matches);
//     let nonce_account = pubkey_of(matches, NONCE_ARG.name);
//     let memo = matches.value_of(MEMO_ARG.name).map(String::from);
//     let (stake_authority, stake_authority_pubkey) =
//         signer_of(matches, STAKE_AUTHORITY_ARG.name, wallet_manager)?;
//     let (nonce_authority, nonce_authority_pubkey) =
//         signer_of(matches, NONCE_AUTHORITY_ARG.name, wallet_manager)?;
//     let (fee_payer, fee_payer_pubkey) = signer_of(matches, FEE_PAYER_ARG.name, wallet_manager)?;

//     let mut bulk_signers = vec![stake_authority, fee_payer, split_stake_account];
//     if nonce_account.is_some() {
//         bulk_signers.push(nonce_authority);
//     }
//     let signer_info =
//         default_signer.generate_unique_signers(bulk_signers, matches, wallet_manager)?;

//     Ok(CliCommandInfo {
//         command: CliCommand::SplitStake {
//             stake_account_pubkey,
//             stake_authority: signer_info.index_of(stake_authority_pubkey).unwrap(),
//             sign_only,
//             dump_transaction_message,
//             blockhash_query,
//             nonce_account,
//             nonce_authority: signer_info.index_of(nonce_authority_pubkey).unwrap(),
//             memo,
//             split_stake_account: signer_info.index_of(split_stake_account_pubkey).unwrap(),
//             seed,
//             lamports,
//             fee_payer: signer_info.index_of(fee_payer_pubkey).unwrap(),
//         },
//         signers: signer_info.signers,
//     })
// }

// pub fn parse_merge_stake(
//     matches: &ArgMatches,
//     default_signer: &DefaultSigner,
//     wallet_manager: &mut Option<Arc<RemoteWalletManager>>,
// ) -> Result<CliCommandInfo, CliError> {
//     let stake_account_pubkey =
//         pubkey_of_signer(matches, "stake_account_pubkey", wallet_manager)?.unwrap();

//     let source_stake_account_pubkey = pubkey_of(matches, "source_stake_account_pubkey").unwrap();

//     let sign_only = matches.is_present(SIGN_ONLY_ARG.name);
//     let dump_transaction_message = matches.is_present(DUMP_TRANSACTION_MESSAGE.name);
//     let blockhash_query = BlockhashQuery::new_from_matches(matches);
//     let nonce_account = pubkey_of(matches, NONCE_ARG.name);
//     let memo = matches.value_of(MEMO_ARG.name).map(String::from);
//     let (stake_authority, stake_authority_pubkey) =
//         signer_of(matches, STAKE_AUTHORITY_ARG.name, wallet_manager)?;
//     let (nonce_authority, nonce_authority_pubkey) =
//         signer_of(matches, NONCE_AUTHORITY_ARG.name, wallet_manager)?;
//     let (fee_payer, fee_payer_pubkey) = signer_of(matches, FEE_PAYER_ARG.name, wallet_manager)?;

//     let mut bulk_signers = vec![stake_authority, fee_payer];
//     if nonce_account.is_some() {
//         bulk_signers.push(nonce_authority);
//     }
//     let signer_info =
//         default_signer.generate_unique_signers(bulk_signers, matches, wallet_manager)?;

//     Ok(CliCommandInfo {
//         command: CliCommand::MergeStake {
//             stake_account_pubkey,
//             source_stake_account_pubkey,
//             stake_authority: signer_info.index_of(stake_authority_pubkey).unwrap(),
//             sign_only,
//             dump_transaction_message,
//             blockhash_query,
//             nonce_account,
//             nonce_authority: signer_info.index_of(nonce_authority_pubkey).unwrap(),
//             memo,
//             fee_payer: signer_info.index_of(fee_payer_pubkey).unwrap(),
//         },
//         signers: signer_info.signers,
//     })
// }

// pub fn parse_stake_deactivate_stake(
//     matches: &ArgMatches,
//     default_signer: &DefaultSigner,
//     wallet_manager: &mut Option<Arc<RemoteWalletManager>>,
// ) -> Result<CliCommandInfo, CliError> {
//     let stake_account_pubkey =
//         pubkey_of_signer(matches, "stake_account_pubkey", wallet_manager)?.unwrap();
//     let sign_only = matches.is_present(SIGN_ONLY_ARG.name);
//     let deactivate_delinquent = matches.is_present("delinquent");
//     let dump_transaction_message = matches.is_present(DUMP_TRANSACTION_MESSAGE.name);
//     let blockhash_query = BlockhashQuery::new_from_matches(matches);
//     let nonce_account = pubkey_of(matches, NONCE_ARG.name);
//     let memo = matches.value_of(MEMO_ARG.name).map(String::from);
//     let seed = value_t!(matches, "seed", String).ok();

//     let (stake_authority, stake_authority_pubkey) =
//         signer_of(matches, STAKE_AUTHORITY_ARG.name, wallet_manager)?;
//     let (nonce_authority, nonce_authority_pubkey) =
//         signer_of(matches, NONCE_AUTHORITY_ARG.name, wallet_manager)?;
//     let (fee_payer, fee_payer_pubkey) = signer_of(matches, FEE_PAYER_ARG.name, wallet_manager)?;

//     let mut bulk_signers = vec![stake_authority, fee_payer];
//     if nonce_account.is_some() {
//         bulk_signers.push(nonce_authority);
//     }
//     let signer_info =
//         default_signer.generate_unique_signers(bulk_signers, matches, wallet_manager)?;

//     Ok(CliCommandInfo {
//         command: CliCommand::DeactivateStake {
//             stake_account_pubkey,
//             stake_authority: signer_info.index_of(stake_authority_pubkey).unwrap(),
//             sign_only,
//             deactivate_delinquent,
//             dump_transaction_message,
//             blockhash_query,
//             nonce_account,
//             nonce_authority: signer_info.index_of(nonce_authority_pubkey).unwrap(),
//             memo,
//             seed,
//             fee_payer: signer_info.index_of(fee_payer_pubkey).unwrap(),
//         },
//         signers: signer_info.signers,
//     })
// }

// pub fn parse_stake_withdraw_stake(
//     matches: &ArgMatches,
//     default_signer: &DefaultSigner,
//     wallet_manager: &mut Option<Arc<RemoteWalletManager>>,
// ) -> Result<CliCommandInfo, CliError> {
//     let stake_account_pubkey =
//         pubkey_of_signer(matches, "stake_account_pubkey", wallet_manager)?.unwrap();
//     let destination_account_pubkey =
//         pubkey_of_signer(matches, "destination_account_pubkey", wallet_manager)?.unwrap();
//     let amount = SpendAmount::new_from_matches(matches, "amount");
//     let sign_only = matches.is_present(SIGN_ONLY_ARG.name);
//     let dump_transaction_message = matches.is_present(DUMP_TRANSACTION_MESSAGE.name);
//     let blockhash_query = BlockhashQuery::new_from_matches(matches);
//     let nonce_account = pubkey_of(matches, NONCE_ARG.name);
//     let memo = matches.value_of(MEMO_ARG.name).map(String::from);
//     let seed = value_t!(matches, "seed", String).ok();
//     let (withdraw_authority, withdraw_authority_pubkey) =
//         signer_of(matches, WITHDRAW_AUTHORITY_ARG.name, wallet_manager)?;
//     let (nonce_authority, nonce_authority_pubkey) =
//         signer_of(matches, NONCE_AUTHORITY_ARG.name, wallet_manager)?;
//     let (fee_payer, fee_payer_pubkey) = signer_of(matches, FEE_PAYER_ARG.name, wallet_manager)?;
//     let (custodian, custodian_pubkey) = signer_of(matches, "custodian", wallet_manager)?;

//     let mut bulk_signers = vec![withdraw_authority, fee_payer];
//     if nonce_account.is_some() {
//         bulk_signers.push(nonce_authority);
//     }
//     if custodian.is_some() {
//         bulk_signers.push(custodian);
//     }
//     let signer_info =
//         default_signer.generate_unique_signers(bulk_signers, matches, wallet_manager)?;

//     Ok(CliCommandInfo {
//         command: CliCommand::WithdrawStake {
//             stake_account_pubkey,
//             destination_account_pubkey,
//             amount,
//             withdraw_authority: signer_info.index_of(withdraw_authority_pubkey).unwrap(),
//             sign_only,
//             dump_transaction_message,
//             blockhash_query,
//             nonce_account,
//             nonce_authority: signer_info.index_of(nonce_authority_pubkey).unwrap(),
//             memo,
//             seed,
//             fee_payer: signer_info.index_of(fee_payer_pubkey).unwrap(),
//             custodian: custodian_pubkey.and_then(|_| signer_info.index_of(custodian_pubkey)),
//         },
//         signers: signer_info.signers,
//     })
// }

// pub fn parse_stake_set_lockup(
//     matches: &ArgMatches,
//     default_signer: &DefaultSigner,
//     wallet_manager: &mut Option<Arc<RemoteWalletManager>>,
//     checked: bool,
// ) -> Result<CliCommandInfo, CliError> {
//     let stake_account_pubkey =
//         pubkey_of_signer(matches, "stake_account_pubkey", wallet_manager)?.unwrap();
//     let epoch = value_of(matches, "lockup_epoch");
//     let unix_timestamp = unix_timestamp_from_rfc3339_datetime(matches, "lockup_date");

//     let (new_custodian_signer, new_custodian) = if checked {
//         signer_of(matches, "new_custodian", wallet_manager)?
//     } else {
//         (
//             None,
//             pubkey_of_signer(matches, "new_custodian", wallet_manager)?,
//         )
//     };

//     let sign_only = matches.is_present(SIGN_ONLY_ARG.name);
//     let dump_transaction_message = matches.is_present(DUMP_TRANSACTION_MESSAGE.name);
//     let blockhash_query = BlockhashQuery::new_from_matches(matches);
//     let nonce_account = pubkey_of(matches, NONCE_ARG.name);
//     let memo = matches.value_of(MEMO_ARG.name).map(String::from);

//     let (custodian, custodian_pubkey) = signer_of(matches, "custodian", wallet_manager)?;
//     let (nonce_authority, nonce_authority_pubkey) =
//         signer_of(matches, NONCE_AUTHORITY_ARG.name, wallet_manager)?;
//     let (fee_payer, fee_payer_pubkey) = signer_of(matches, FEE_PAYER_ARG.name, wallet_manager)?;

//     let mut bulk_signers = vec![custodian, fee_payer];
//     if nonce_account.is_some() {
//         bulk_signers.push(nonce_authority);
//     }
//     if new_custodian_signer.is_some() {
//         bulk_signers.push(new_custodian_signer);
//     }
//     let signer_info =
//         default_signer.generate_unique_signers(bulk_signers, matches, wallet_manager)?;

//     Ok(CliCommandInfo {
//         command: CliCommand::StakeSetLockup {
//             stake_account_pubkey,
//             lockup: LockupArgs {
//                 custodian: new_custodian,
//                 epoch,
//                 unix_timestamp,
//             },
//             new_custodian_signer: if checked {
//                 signer_info.index_of(new_custodian)
//             } else {
//                 None
//             },
//             custodian: signer_info.index_of(custodian_pubkey).unwrap(),
//             sign_only,
//             dump_transaction_message,
//             blockhash_query,
//             nonce_account,
//             nonce_authority: signer_info.index_of(nonce_authority_pubkey).unwrap(),
//             memo,
//             fee_payer: signer_info.index_of(fee_payer_pubkey).unwrap(),
//         },
//         signers: signer_info.signers,
//     })
// }

pub fn parse_show_stake_account(
    matches: &ArgMatches,
    wallet_manager: &mut Option<Rc<RemoteWalletManager>>,
) -> Result<CliCommandInfo, CliError> {
    let stake_account_pubkey =
        pubkey_of_signer(matches, "stake_account_pubkey", wallet_manager)?.unwrap();
    let use_lamports_unit = matches.is_present("lamports");
    let with_rewards = if matches.is_present("with_rewards") {
        Some(value_of(matches, "num_rewards_epochs").unwrap())
    } else {
        None
    };
    Ok(CliCommandInfo {
        command: CliCommand::ShowStakeAccount {
            pubkey: stake_account_pubkey,
            use_lamports_unit,
            with_rewards,
        },
        signers: vec![],
    })
}

pub fn parse_show_stake_history(matches: &ArgMatches) -> Result<CliCommandInfo, CliError> {
    let use_lamports_unit = matches.is_present("lamports");
    let limit_results = value_of(matches, "limit").unwrap();
    Ok(CliCommandInfo {
        command: CliCommand::ShowStakeHistory {
            use_lamports_unit,
            limit_results,
        },
        signers: vec![],
    })
}

// #[allow(clippy::too_many_arguments)]
// pub fn process_create_stake_account(
//     rpc_client: &WasmClient,
//     config: &CliConfig<'_>,
//     stake_account: SignerIndex,
//     seed: &Option<String>,
//     staker: &Option<Pubkey>,
//     withdrawer: &Option<Pubkey>,
//     withdrawer_signer: Option<SignerIndex>,
//     lockup: &Lockup,
//     amount: SpendAmount,
//     sign_only: bool,
//     dump_transaction_message: bool,
//     blockhash_query: &BlockhashQuery,
//     nonce_account: Option<&Pubkey>,
//     nonce_authority: SignerIndex,
//     memo: Option<&String>,
//     fee_payer: SignerIndex,
//     from: SignerIndex,
// ) -> ProcessResult {
//     let stake_account = config.signers[stake_account];
//     let stake_account_address = if let Some(seed) = seed {
//         Pubkey::create_with_seed(&stake_account.pubkey(), seed, &stake::program::id())?
//     } else {
//         stake_account.pubkey()
//     };
//     let from = config.signers[from];
//     check_unique_pubkeys(
//         (&from.pubkey(), "from keypair".to_string()),
//         (&stake_account_address, "stake_account".to_string()),
//     )?;

//     let fee_payer = config.signers[fee_payer];
//     let nonce_authority = config.signers[nonce_authority];

//     let build_message = |lamports| {
//         let authorized = Authorized {
//             staker: staker.unwrap_or(from.pubkey()),
//             withdrawer: withdrawer.unwrap_or(from.pubkey()),
//         };

//         let ixs = match (seed, withdrawer_signer) {
//             (Some(seed), Some(_withdrawer_signer)) => {
//                 stake_instruction::create_account_with_seed_checked(
//                     &from.pubkey(),          // from
//                     &stake_account_address,  // to
//                     &stake_account.pubkey(), // base
//                     seed,                    // seed
//                     &authorized,
//                     lamports,
//                 )
//             }
//             (Some(seed), None) => stake_instruction::create_account_with_seed(
//                 &from.pubkey(),          // from
//                 &stake_account_address,  // to
//                 &stake_account.pubkey(), // base
//                 seed,                    // seed
//                 &authorized,
//                 lockup,
//                 lamports,
//             ),
//             (None, Some(_withdrawer_signer)) => stake_instruction::create_account_checked(
//                 &from.pubkey(),
//                 &stake_account.pubkey(),
//                 &authorized,
//                 lamports,
//             ),
//             (None, None) => stake_instruction::create_account(
//                 &from.pubkey(),
//                 &stake_account.pubkey(),
//                 &authorized,
//                 lockup,
//                 lamports,
//             ),
//         }
//         .with_memo(memo);
//         if let Some(nonce_account) = &nonce_account {
//             Message::new_with_nonce(
//                 ixs,
//                 Some(&fee_payer.pubkey()),
//                 nonce_account,
//                 &nonce_authority.pubkey(),
//             )
//         } else {
//             Message::new(&ixs, Some(&fee_payer.pubkey()))
//         }
//     };

//     let recent_blockhash = blockhash_query.get_blockhash(rpc_client, config.commitment)?;

//     let (message, lamports) = resolve_spend_tx_and_check_account_balances(
//         rpc_client,
//         sign_only,
//         amount,
//         &recent_blockhash,
//         &from.pubkey(),
//         &fee_payer.pubkey(),
//         build_message,
//         config.commitment,
//     )?;

//     if !sign_only {
//         if let Ok(stake_account) = rpc_client.get_account(&stake_account_address) {
//             let err_msg = if stake_account.owner == stake::program::id() {
//                 format!("Stake account {} already exists", stake_account_address)
//             } else {
//                 format!(
//                     "Account {} already exists and is not a stake account",
//                     stake_account_address
//                 )
//             };
//             return Err(CliError::BadParameter(err_msg).into());
//         }

//         let minimum_balance =
//             rpc_client.get_minimum_balance_for_rent_exemption(StakeState::size_of())?;

//         if lamports < minimum_balance {
//             return Err(CliError::BadParameter(format!(
//                 "need at least {} lamports for stake account to be rent exempt, provided lamports: {}",
//                 minimum_balance, lamports
//             ))
//             .into());
//         }

//         if let Some(nonce_account) = &nonce_account {
//             let nonce_account = nonce_utils::get_account_with_commitment(
//                 rpc_client,
//                 nonce_account,
//                 config.commitment,
//             )?;
//             check_nonce_account(&nonce_account, &nonce_authority.pubkey(), &recent_blockhash)?;
//         }
//     }

//     let mut tx = Transaction::new_unsigned(message);
//     if sign_only {
//         tx.try_partial_sign(&config.signers, recent_blockhash)?;
//         return_signers_with_config(
//             &tx,
//             &config.output_format,
//             &ReturnSignersConfig {
//                 dump_transaction_message,
//             },
//         )
//     } else {
//         tx.try_sign(&config.signers, recent_blockhash)?;
//         let result = rpc_client.send_and_confirm_transaction_with_spinner(&tx);
//         log_instruction_custom_error::<SystemError>(result, config)
//     }
// }

// #[allow(clippy::too_many_arguments)]
// pub fn process_stake_authorize(
//     rpc_client: &WasmClient,
//     config: &CliConfig<'_>,
//     stake_account_pubkey: &Pubkey,
//     new_authorizations: &[StakeAuthorizationIndexed],
//     custodian: Option<SignerIndex>,
//     sign_only: bool,
//     dump_transaction_message: bool,
//     blockhash_query: &BlockhashQuery,
//     nonce_account: Option<Pubkey>,
//     nonce_authority: SignerIndex,
//     memo: Option<&String>,
//     fee_payer: SignerIndex,
//     no_wait: bool,
// ) -> ProcessResult {
//     let mut ixs = Vec::new();
//     let custodian = custodian.map(|index| config.signers[index]);
//     let current_stake_account = if !sign_only {
//         Some(get_stake_account_state(
//             rpc_client,
//             stake_account_pubkey,
//             config.commitment,
//         )?)
//     } else {
//         None
//     };
//     for StakeAuthorizationIndexed {
//         authorization_type,
//         new_authority_pubkey,
//         authority,
//         new_authority_signer,
//     } in new_authorizations.iter()
//     {
//         check_unique_pubkeys(
//             (stake_account_pubkey, "stake_account_pubkey".to_string()),
//             (new_authority_pubkey, "new_authorized_pubkey".to_string()),
//         )?;
//         let authority = config.signers[*authority];
//         if let Some(current_stake_account) = current_stake_account {
//             let authorized = match current_stake_account {
//                 StakeState::Stake(Meta { authorized, .. }, ..) => Some(authorized),
//                 StakeState::Initialized(Meta { authorized, .. }) => Some(authorized),
//                 _ => None,
//             };
//             if let Some(authorized) = authorized {
//                 match authorization_type {
//                     StakeAuthorize::Staker => check_current_authority(
//                         &[authorized.withdrawer, authorized.staker],
//                         &authority.pubkey(),
//                     )?,
//                     StakeAuthorize::Withdrawer => {
//                         check_current_authority(&[authorized.withdrawer], &authority.pubkey())?;
//                     }
//                 }
//             } else {
//                 return Err(CliError::RpcRequestError(format!(
//                     "{:?} is not an Initialized or Delegated stake account",
//                     stake_account_pubkey,
//                 ))
//                 .into());
//             }
//         }
//         if new_authority_signer.is_some() {
//             ixs.push(stake_instruction::authorize_checked(
//                 stake_account_pubkey, // stake account to update
//                 &authority.pubkey(),  // currently authorized
//                 new_authority_pubkey, // new stake signer
//                 *authorization_type,  // stake or withdraw
//                 custodian.map(|signer| signer.pubkey()).as_ref(),
//             ));
//         } else {
//             ixs.push(stake_instruction::authorize(
//                 stake_account_pubkey, // stake account to update
//                 &authority.pubkey(),  // currently authorized
//                 new_authority_pubkey, // new stake signer
//                 *authorization_type,  // stake or withdraw
//                 custodian.map(|signer| signer.pubkey()).as_ref(),
//             ));
//         }
//     }
//     ixs = ixs.with_memo(memo);

//     let recent_blockhash = blockhash_query.get_blockhash(rpc_client, config.commitment)?;

//     let nonce_authority = config.signers[nonce_authority];
//     let fee_payer = config.signers[fee_payer];

//     let message = if let Some(nonce_account) = &nonce_account {
//         Message::new_with_nonce(
//             ixs,
//             Some(&fee_payer.pubkey()),
//             nonce_account,
//             &nonce_authority.pubkey(),
//         )
//     } else {
//         Message::new(&ixs, Some(&fee_payer.pubkey()))
//     };
//     let mut tx = Transaction::new_unsigned(message);

//     if sign_only {
//         tx.try_partial_sign(&config.signers, recent_blockhash)?;
//         return_signers_with_config(
//             &tx,
//             &config.output_format,
//             &ReturnSignersConfig {
//                 dump_transaction_message,
//             },
//         )
//     } else {
//         tx.try_sign(&config.signers, recent_blockhash)?;
//         if let Some(nonce_account) = &nonce_account {
//             let nonce_account = nonce_utils::get_account_with_commitment(
//                 rpc_client,
//                 nonce_account,
//                 config.commitment,
//             )?;
//             check_nonce_account(&nonce_account, &nonce_authority.pubkey(), &recent_blockhash)?;
//         }
//         check_account_for_fee_with_commitment(
//             rpc_client,
//             &tx.message.account_keys[0],
//             &tx.message,
//             config.commitment,
//         )?;
//         let result = if no_wait {
//             rpc_client.send_transaction(&tx)
//         } else {
//             rpc_client.send_and_confirm_transaction_with_spinner(&tx)
//         };
//         log_instruction_custom_error::<StakeError>(result, config)
//     }
// }

// #[allow(clippy::too_many_arguments)]
// pub fn process_deactivate_stake_account(
//     rpc_client: &WasmClient,
//     config: &CliConfig<'_>,
//     stake_account_pubkey: &Pubkey,
//     stake_authority: SignerIndex,
//     sign_only: bool,
//     deactivate_delinquent: bool,
//     dump_transaction_message: bool,
//     blockhash_query: &BlockhashQuery,
//     nonce_account: Option<Pubkey>,
//     nonce_authority: SignerIndex,
//     memo: Option<&String>,
//     seed: Option<&String>,
//     fee_payer: SignerIndex,
// ) -> ProcessResult {
//     let recent_blockhash = blockhash_query.get_blockhash(rpc_client, config.commitment)?;

//     let stake_account_address = if let Some(seed) = seed {
//         Pubkey::create_with_seed(stake_account_pubkey, seed, &stake::program::id())?
//     } else {
//         *stake_account_pubkey
//     };

//     let ixs = vec![if deactivate_delinquent {
//         let stake_account = rpc_client.get_account(&stake_account_address)?;
//         if stake_account.owner != stake::program::id() {
//             return Err(CliError::BadParameter(format!(
//                 "{} is not a stake account",
//                 stake_account_address,
//             ))
//             .into());
//         }

//         let vote_account_address = match stake_account.state() {
//             Ok(stake_state) => match stake_state {
//                 StakeState::Stake(_, stake) => stake.delegation.voter_pubkey,
//                 _ => {
//                     return Err(CliError::BadParameter(format!(
//                         "{} is not a delegated stake account",
//                         stake_account_address,
//                     ))
//                     .into())
//                 }
//             },
//             Err(err) => {
//                 return Err(CliError::RpcRequestError(format!(
//                     "Account data could not be deserialized to stake state: {}",
//                     err
//                 ))
//                 .into())
//             }
//         };

//         let current_epoch = rpc_client.get_epoch_info()?.epoch;

//         let (_, vote_state) = crate::vote::get_vote_account(
//             rpc_client,
//             &vote_account_address,
//             rpc_client.commitment(),
//         )?;
//         if !eligible_for_deactivate_delinquent(&vote_state.epoch_credits, current_epoch) {
//             return Err(CliError::BadParameter(format!(
//                 "Stake has not been delinquent for {} epochs",
//                 stake::MINIMUM_DELINQUENT_EPOCHS_FOR_DEACTIVATION,
//             ))
//             .into());
//         }

//         // Search for a reference vote account
//         let reference_vote_account_address = rpc_client
//             .get_vote_accounts()?
//             .current
//             .into_iter()
//             .find(|vote_account_info| {
//                 acceptable_reference_epoch_credits(&vote_account_info.epoch_credits, current_epoch)
//             });
//         let reference_vote_account_address = reference_vote_account_address
//             .ok_or_else(|| {
//                 CliError::RpcRequestError("Unable to find a reference vote account".into())
//             })?
//             .vote_pubkey
//             .parse()?;

//         stake_instruction::deactivate_delinquent_stake(
//             &stake_account_address,
//             &vote_account_address,
//             &reference_vote_account_address,
//         )
//     } else {
//         let stake_authority = config.signers[stake_authority];
//         stake_instruction::deactivate_stake(&stake_account_address, &stake_authority.pubkey())
//     }]
//     .with_memo(memo);

//     let nonce_authority = config.signers[nonce_authority];
//     let fee_payer = config.signers[fee_payer];

//     let message = if let Some(nonce_account) = &nonce_account {
//         Message::new_with_nonce(
//             ixs,
//             Some(&fee_payer.pubkey()),
//             nonce_account,
//             &nonce_authority.pubkey(),
//         )
//     } else {
//         Message::new(&ixs, Some(&fee_payer.pubkey()))
//     };
//     let mut tx = Transaction::new_unsigned(message);

//     if sign_only {
//         tx.try_partial_sign(&config.signers, recent_blockhash)?;
//         return_signers_with_config(
//             &tx,
//             &config.output_format,
//             &ReturnSignersConfig {
//                 dump_transaction_message,
//             },
//         )
//     } else {
//         tx.try_sign(&config.signers, recent_blockhash)?;
//         if let Some(nonce_account) = &nonce_account {
//             let nonce_account = nonce_utils::get_account_with_commitment(
//                 rpc_client,
//                 nonce_account,
//                 config.commitment,
//             )?;
//             check_nonce_account(&nonce_account, &nonce_authority.pubkey(), &recent_blockhash)?;
//         }
//         check_account_for_fee_with_commitment(
//             rpc_client,
//             &tx.message.account_keys[0],
//             &tx.message,
//             config.commitment,
//         )?;
//         let result = rpc_client.send_and_confirm_transaction_with_spinner(&tx);
//         log_instruction_custom_error::<StakeError>(result, config)
//     }
// }

// #[allow(clippy::too_many_arguments)]
// pub fn process_withdraw_stake(
//     rpc_client: &WasmClient,
//     config: &CliConfig<'_>,
//     stake_account_pubkey: &Pubkey,
//     destination_account_pubkey: &Pubkey,
//     amount: SpendAmount,
//     withdraw_authority: SignerIndex,
//     custodian: Option<SignerIndex>,
//     sign_only: bool,
//     dump_transaction_message: bool,
//     blockhash_query: &BlockhashQuery,
//     nonce_account: Option<&Pubkey>,
//     nonce_authority: SignerIndex,
//     memo: Option<&String>,
//     seed: Option<&String>,
//     fee_payer: SignerIndex,
// ) -> ProcessResult {
//     let withdraw_authority = config.signers[withdraw_authority];
//     let custodian = custodian.map(|index| config.signers[index]);

//     let stake_account_address = if let Some(seed) = seed {
//         Pubkey::create_with_seed(stake_account_pubkey, seed, &stake::program::id())?
//     } else {
//         *stake_account_pubkey
//     };

//     let recent_blockhash = blockhash_query.get_blockhash(rpc_client, config.commitment)?;

//     let fee_payer = config.signers[fee_payer];
//     let nonce_authority = config.signers[nonce_authority];

//     let build_message = |lamports| {
//         let ixs = vec![stake_instruction::withdraw(
//             &stake_account_address,
//             &withdraw_authority.pubkey(),
//             destination_account_pubkey,
//             lamports,
//             custodian.map(|signer| signer.pubkey()).as_ref(),
//         )]
//         .with_memo(memo);

//         if let Some(nonce_account) = &nonce_account {
//             Message::new_with_nonce(
//                 ixs,
//                 Some(&fee_payer.pubkey()),
//                 nonce_account,
//                 &nonce_authority.pubkey(),
//             )
//         } else {
//             Message::new(&ixs, Some(&fee_payer.pubkey()))
//         }
//     };

//     let (message, _) = resolve_spend_tx_and_check_account_balances(
//         rpc_client,
//         sign_only,
//         amount,
//         &recent_blockhash,
//         &stake_account_address,
//         &fee_payer.pubkey(),
//         build_message,
//         config.commitment,
//     )?;

//     let mut tx = Transaction::new_unsigned(message);

//     if sign_only {
//         tx.try_partial_sign(&config.signers, recent_blockhash)?;
//         return_signers_with_config(
//             &tx,
//             &config.output_format,
//             &ReturnSignersConfig {
//                 dump_transaction_message,
//             },
//         )
//     } else {
//         tx.try_sign(&config.signers, recent_blockhash)?;
//         if let Some(nonce_account) = &nonce_account {
//             let nonce_account = nonce_utils::get_account_with_commitment(
//                 rpc_client,
//                 nonce_account,
//                 config.commitment,
//             )?;
//             check_nonce_account(&nonce_account, &nonce_authority.pubkey(), &recent_blockhash)?;
//         }
//         check_account_for_fee_with_commitment(
//             rpc_client,
//             &tx.message.account_keys[0],
//             &tx.message,
//             config.commitment,
//         )?;
//         let result = rpc_client.send_and_confirm_transaction_with_spinner(&tx);
//         log_instruction_custom_error::<StakeError>(result, config)
//     }
// }

// #[allow(clippy::too_many_arguments)]
// pub fn process_split_stake(
//     rpc_client: &WasmClient,
//     config: &CliConfig<'_>,
//     stake_account_pubkey: &Pubkey,
//     stake_authority: SignerIndex,
//     sign_only: bool,
//     dump_transaction_message: bool,
//     blockhash_query: &BlockhashQuery,
//     nonce_account: Option<Pubkey>,
//     nonce_authority: SignerIndex,
//     memo: Option<&String>,
//     split_stake_account: SignerIndex,
//     split_stake_account_seed: &Option<String>,
//     lamports: u64,
//     fee_payer: SignerIndex,
// ) -> ProcessResult {
//     let split_stake_account = config.signers[split_stake_account];
//     let fee_payer = config.signers[fee_payer];

//     if split_stake_account_seed.is_none() {
//         check_unique_pubkeys(
//             (&fee_payer.pubkey(), "fee-payer keypair".to_string()),
//             (
//                 &split_stake_account.pubkey(),
//                 "split_stake_account".to_string(),
//             ),
//         )?;
//     }
//     check_unique_pubkeys(
//         (&fee_payer.pubkey(), "fee-payer keypair".to_string()),
//         (stake_account_pubkey, "stake_account".to_string()),
//     )?;
//     check_unique_pubkeys(
//         (stake_account_pubkey, "stake_account".to_string()),
//         (
//             &split_stake_account.pubkey(),
//             "split_stake_account".to_string(),
//         ),
//     )?;

//     let stake_authority = config.signers[stake_authority];

//     let split_stake_account_address = if let Some(seed) = split_stake_account_seed {
//         Pubkey::create_with_seed(&split_stake_account.pubkey(), seed, &stake::program::id())?
//     } else {
//         split_stake_account.pubkey()
//     };

//     if !sign_only {
//         if let Ok(stake_account) = rpc_client.get_account(&split_stake_account_address) {
//             let err_msg = if stake_account.owner == stake::program::id() {
//                 format!(
//                     "Stake account {} already exists",
//                     split_stake_account_address
//                 )
//             } else {
//                 format!(
//                     "Account {} already exists and is not a stake account",
//                     split_stake_account_address
//                 )
//             };
//             return Err(CliError::BadParameter(err_msg).into());
//         }

//         let minimum_balance =
//             rpc_client.get_minimum_balance_for_rent_exemption(StakeState::size_of())?;

//         if lamports < minimum_balance {
//             return Err(CliError::BadParameter(format!(
//                 "need at least {} lamports for stake account to be rent exempt, provided lamports: {}",
//                 minimum_balance, lamports
//             ))
//             .into());
//         }
//     }

//     let recent_blockhash = blockhash_query.get_blockhash(rpc_client, config.commitment)?;

//     let ixs = if let Some(seed) = split_stake_account_seed {
//         stake_instruction::split_with_seed(
//             stake_account_pubkey,
//             &stake_authority.pubkey(),
//             lamports,
//             &split_stake_account_address,
//             &split_stake_account.pubkey(),
//             seed,
//         )
//         .with_memo(memo)
//     } else {
//         stake_instruction::split(
//             stake_account_pubkey,
//             &stake_authority.pubkey(),
//             lamports,
//             &split_stake_account_address,
//         )
//         .with_memo(memo)
//     };

//     let nonce_authority = config.signers[nonce_authority];

//     let message = if let Some(nonce_account) = &nonce_account {
//         Message::new_with_nonce(
//             ixs,
//             Some(&fee_payer.pubkey()),
//             nonce_account,
//             &nonce_authority.pubkey(),
//         )
//     } else {
//         Message::new(&ixs, Some(&fee_payer.pubkey()))
//     };
//     let mut tx = Transaction::new_unsigned(message);

//     if sign_only {
//         tx.try_partial_sign(&config.signers, recent_blockhash)?;
//         return_signers_with_config(
//             &tx,
//             &config.output_format,
//             &ReturnSignersConfig {
//                 dump_transaction_message,
//             },
//         )
//     } else {
//         tx.try_sign(&config.signers, recent_blockhash)?;
//         if let Some(nonce_account) = &nonce_account {
//             let nonce_account = nonce_utils::get_account_with_commitment(
//                 rpc_client,
//                 nonce_account,
//                 config.commitment,
//             )?;
//             check_nonce_account(&nonce_account, &nonce_authority.pubkey(), &recent_blockhash)?;
//         }
//         check_account_for_fee_with_commitment(
//             rpc_client,
//             &tx.message.account_keys[0],
//             &tx.message,
//             config.commitment,
//         )?;
//         let result = rpc_client.send_and_confirm_transaction_with_spinner(&tx);
//         log_instruction_custom_error::<StakeError>(result, config)
//     }
// }

// #[allow(clippy::too_many_arguments)]
// pub fn process_merge_stake(
//     rpc_client: &WasmClient,
//     config: &CliConfig<'_>,
//     stake_account_pubkey: &Pubkey,
//     source_stake_account_pubkey: &Pubkey,
//     stake_authority: SignerIndex,
//     sign_only: bool,
//     dump_transaction_message: bool,
//     blockhash_query: &BlockhashQuery,
//     nonce_account: Option<Pubkey>,
//     nonce_authority: SignerIndex,
//     memo: Option<&String>,
//     fee_payer: SignerIndex,
// ) -> ProcessResult {
//     let fee_payer = config.signers[fee_payer];

//     check_unique_pubkeys(
//         (&fee_payer.pubkey(), "fee-payer keypair".to_string()),
//         (stake_account_pubkey, "stake_account".to_string()),
//     )?;
//     check_unique_pubkeys(
//         (&fee_payer.pubkey(), "fee-payer keypair".to_string()),
//         (
//             source_stake_account_pubkey,
//             "source_stake_account".to_string(),
//         ),
//     )?;
//     check_unique_pubkeys(
//         (stake_account_pubkey, "stake_account".to_string()),
//         (
//             source_stake_account_pubkey,
//             "source_stake_account".to_string(),
//         ),
//     )?;

//     let stake_authority = config.signers[stake_authority];

//     if !sign_only {
//         for stake_account_address in &[stake_account_pubkey, source_stake_account_pubkey] {
//             if let Ok(stake_account) = rpc_client.get_account(stake_account_address) {
//                 if stake_account.owner != stake::program::id() {
//                     return Err(CliError::BadParameter(format!(
//                         "Account {} is not a stake account",
//                         stake_account_address
//                     ))
//                     .into());
//                 }
//             }
//         }
//     }

//     let recent_blockhash = blockhash_query.get_blockhash(rpc_client, config.commitment)?;

//     let ixs = stake_instruction::merge(
//         stake_account_pubkey,
//         source_stake_account_pubkey,
//         &stake_authority.pubkey(),
//     )
//     .with_memo(memo);

//     let nonce_authority = config.signers[nonce_authority];

//     let message = if let Some(nonce_account) = &nonce_account {
//         Message::new_with_nonce(
//             ixs,
//             Some(&fee_payer.pubkey()),
//             nonce_account,
//             &nonce_authority.pubkey(),
//         )
//     } else {
//         Message::new(&ixs, Some(&fee_payer.pubkey()))
//     };
//     let mut tx = Transaction::new_unsigned(message);

//     if sign_only {
//         tx.try_partial_sign(&config.signers, recent_blockhash)?;
//         return_signers_with_config(
//             &tx,
//             &config.output_format,
//             &ReturnSignersConfig {
//                 dump_transaction_message,
//             },
//         )
//     } else {
//         tx.try_sign(&config.signers, recent_blockhash)?;
//         if let Some(nonce_account) = &nonce_account {
//             let nonce_account = nonce_utils::get_account_with_commitment(
//                 rpc_client,
//                 nonce_account,
//                 config.commitment,
//             )?;
//             check_nonce_account(&nonce_account, &nonce_authority.pubkey(), &recent_blockhash)?;
//         }
//         check_account_for_fee_with_commitment(
//             rpc_client,
//             &tx.message.account_keys[0],
//             &tx.message,
//             config.commitment,
//         )?;
//         let result = rpc_client.send_and_confirm_transaction_with_spinner_and_config(
//             &tx,
//             config.commitment,
//             config.send_transaction_config,
//         );
//         log_instruction_custom_error::<StakeError>(result, config)
//     }
// }

// #[allow(clippy::too_many_arguments)]
// pub fn process_stake_set_lockup(
//     rpc_client: &WasmClient,
//     config: &CliConfig<'_>,
//     stake_account_pubkey: &Pubkey,
//     lockup: &LockupArgs,
//     new_custodian_signer: Option<SignerIndex>,
//     custodian: SignerIndex,
//     sign_only: bool,
//     dump_transaction_message: bool,
//     blockhash_query: &BlockhashQuery,
//     nonce_account: Option<Pubkey>,
//     nonce_authority: SignerIndex,
//     memo: Option<&String>,
//     fee_payer: SignerIndex,
// ) -> ProcessResult {
//     let recent_blockhash = blockhash_query.get_blockhash(rpc_client, config.commitment)?;
//     let custodian = config.signers[custodian];

//     let ixs = vec![if new_custodian_signer.is_some() {
//         stake_instruction::set_lockup_checked(stake_account_pubkey, lockup, &custodian.pubkey())
//     } else {
//         stake_instruction::set_lockup(stake_account_pubkey, lockup, &custodian.pubkey())
//     }]
//     .with_memo(memo);
//     let nonce_authority = config.signers[nonce_authority];
//     let fee_payer = config.signers[fee_payer];

//     if !sign_only {
//         let state = get_stake_account_state(rpc_client, stake_account_pubkey, config.commitment)?;
//         let lockup = match state {
//             StakeState::Stake(Meta { lockup, .. }, ..) => Some(lockup),
//             StakeState::Initialized(Meta { lockup, .. }) => Some(lockup),
//             _ => None,
//         };
//         if let Some(lockup) = lockup {
//             if lockup.custodian != Pubkey::default() {
//                 check_current_authority(&[lockup.custodian], &custodian.pubkey())?;
//             }
//         } else {
//             return Err(CliError::RpcRequestError(format!(
//                 "{:?} is not an Initialized or Delegated stake account",
//                 stake_account_pubkey,
//             ))
//             .into());
//         }
//     }

//     let message = if let Some(nonce_account) = &nonce_account {
//         Message::new_with_nonce(
//             ixs,
//             Some(&fee_payer.pubkey()),
//             nonce_account,
//             &nonce_authority.pubkey(),
//         )
//     } else {
//         Message::new(&ixs, Some(&fee_payer.pubkey()))
//     };
//     let mut tx = Transaction::new_unsigned(message);

//     if sign_only {
//         tx.try_partial_sign(&config.signers, recent_blockhash)?;
//         return_signers_with_config(
//             &tx,
//             &config.output_format,
//             &ReturnSignersConfig {
//                 dump_transaction_message,
//             },
//         )
//     } else {
//         tx.try_sign(&config.signers, recent_blockhash)?;
//         if let Some(nonce_account) = &nonce_account {
//             let nonce_account = nonce_utils::get_account_with_commitment(
//                 rpc_client,
//                 nonce_account,
//                 config.commitment,
//             )?;
//             check_nonce_account(&nonce_account, &nonce_authority.pubkey(), &recent_blockhash)?;
//         }
//         check_account_for_fee_with_commitment(
//             rpc_client,
//             &tx.message.account_keys[0],
//             &tx.message,
//             config.commitment,
//         )?;
//         let result = rpc_client.send_and_confirm_transaction_with_spinner(&tx);
//         log_instruction_custom_error::<StakeError>(result, config)
//     }
// }

fn u64_some_if_not_zero(n: u64) -> Option<u64> {
    if n > 0 {
        Some(n)
    } else {
        None
    }
}

pub fn build_stake_state(
    account_balance: u64,
    stake_state: &StakeStateV2,
    use_lamports_unit: bool,
    stake_history: &StakeHistory,
    clock: &Clock,
) -> CliStakeState {
    match stake_state {
        StakeStateV2::Stake(
            Meta {
                rent_exempt_reserve,
                authorized,
                lockup,
            },
            stake,
            _,
        ) => {
            let current_epoch = clock.epoch;
            let StakeActivationStatus {
                effective,
                activating,
                deactivating,
            } = stake.delegation.stake_activating_and_deactivating(
                current_epoch,
                stake_history,
                None,
            );
            let lockup = if lockup.is_in_force(clock, None) {
                Some(lockup.into())
            } else {
                None
            };
            CliStakeState {
                stake_type: CliStakeType::Stake,
                account_balance,
                credits_observed: Some(stake.credits_observed),
                delegated_stake: Some(stake.delegation.stake),
                delegated_vote_account_address: if stake.delegation.voter_pubkey
                    != Pubkey::default()
                {
                    Some(stake.delegation.voter_pubkey.to_string())
                } else {
                    None
                },
                activation_epoch: Some(if stake.delegation.activation_epoch < u64::MAX {
                    stake.delegation.activation_epoch
                } else {
                    0
                }),
                deactivation_epoch: if stake.delegation.deactivation_epoch < u64::MAX {
                    Some(stake.delegation.deactivation_epoch)
                } else {
                    None
                },
                authorized: Some(authorized.into()),
                lockup,
                use_lamports_unit,
                current_epoch,
                rent_exempt_reserve: Some(*rent_exempt_reserve),
                active_stake: u64_some_if_not_zero(effective),
                activating_stake: u64_some_if_not_zero(activating),
                deactivating_stake: u64_some_if_not_zero(deactivating),
                ..CliStakeState::default()
            }
        }
        StakeStateV2::RewardsPool => CliStakeState {
            stake_type: CliStakeType::RewardsPool,
            account_balance,
            ..CliStakeState::default()
        },
        StakeStateV2::Uninitialized => CliStakeState {
            account_balance,
            ..CliStakeState::default()
        },
        StakeStateV2::Initialized(Meta {
            rent_exempt_reserve,
            authorized,
            lockup,
        }) => {
            let lockup = if lockup.is_in_force(clock, None) {
                Some(lockup.into())
            } else {
                None
            };
            CliStakeState {
                stake_type: CliStakeType::Initialized,
                account_balance,
                credits_observed: Some(0),
                authorized: Some(authorized.into()),
                lockup,
                use_lamports_unit,
                rent_exempt_reserve: Some(*rent_exempt_reserve),
                ..CliStakeState::default()
            }
        }
    }
}

// fn get_stake_account_state(
//     rpc_client: &WasmClient,
//     stake_account_pubkey: &Pubkey,
//     commitment_config: CommitmentConfig,
// ) -> Result<StakeState, Box<dyn std::error::Error>> {
//     let stake_account = rpc_client
//         .get_account_with_commitment(stake_account_pubkey, commitment_config)?
//         .value
//         .ok_or_else(|| {
//             CliError::RpcRequestError(format!("{:?} account does not exist", stake_account_pubkey))
//         })?;
//     if stake_account.owner != stake::program::id() {
//         return Err(CliError::RpcRequestError(format!(
//             "{:?} is not a stake account",
//             stake_account_pubkey,
//         ))
//         .into());
//     }
//     stake_account.state().map_err(|err| {
//         CliError::RpcRequestError(format!(
//             "Account data could not be deserialized to stake state: {}",
//             err
//         ))
//         .into()
//     })
// }

pub(crate) fn check_current_authority(
    permitted_authorities: &[Pubkey],
    provided_current_authority: &Pubkey,
) -> Result<(), CliError> {
    if !permitted_authorities.contains(provided_current_authority) {
        Err(CliError::RpcRequestError(format!(
            "Invalid authority provided: {:?}, expected {:?}",
            provided_current_authority, permitted_authorities
        )))
    } else {
        Ok(())
    }
}

pub async fn get_epoch_boundary_timestamps(
    rpc_client: &WasmClient,
    reward: &RpcInflationReward,
    epoch_schedule: &EpochSchedule,
) -> Result<(UnixTimestamp, UnixTimestamp), Box<dyn std::error::Error>> {
    let epoch_end_time = rpc_client.get_block_time(reward.effective_slot).await?;
    let mut epoch_start_slot = epoch_schedule.get_first_slot_in_epoch(reward.epoch);
    let epoch_start_time = loop {
        if epoch_start_slot >= reward.effective_slot {
            return Err("epoch_start_time not found".to_string().into());
        }
        match rpc_client.get_block_time(epoch_start_slot).await {
            Ok(block_time) => {
                break block_time;
            }
            Err(_) => {
                epoch_start_slot += 1;
            }
        }
    };
    Ok((epoch_start_time, epoch_end_time))
}

pub fn make_cli_reward(
    reward: &RpcInflationReward,
    epoch_start_time: UnixTimestamp,
    epoch_end_time: UnixTimestamp,
) -> Option<CliEpochReward> {
    let wallclock_epoch_duration = epoch_end_time.checked_sub(epoch_start_time)?;
    if reward.post_balance > reward.amount {
        let rate_change = reward.amount as f64 / (reward.post_balance - reward.amount) as f64;

        let wallclock_epochs_per_year =
            (SECONDS_PER_DAY * 365) as f64 / wallclock_epoch_duration as f64;
        let apr = rate_change * wallclock_epochs_per_year;

        Some(CliEpochReward {
            epoch: reward.epoch,
            effective_slot: reward.effective_slot,
            amount: reward.amount,
            post_balance: reward.post_balance,
            percent_change: rate_change * 100.0,
            apr: Some(apr * 100.0),
            commission: reward.commission,
        })
    } else {
        None
    }
}

pub(crate) async fn fetch_epoch_rewards(
    rpc_client: &WasmClient,
    address: &Pubkey,
    mut num_epochs: usize,
) -> Result<Vec<CliEpochReward>, Box<dyn std::error::Error>> {
    let mut all_epoch_rewards = vec![];
    let epoch_schedule = rpc_client.get_epoch_schedule().await?;
    let mut rewards_epoch = rpc_client.get_epoch_info().await?.epoch;

    // NOTE: Change for WASM
    // let mut process_reward =
    //     |reward: &Option<RpcInflationReward>| -> Result<(), Box<dyn std::error::Error>> {
    //         if let Some(reward) = reward {
    //             let (epoch_start_time, epoch_end_time) =
    //                 get_epoch_boundary_timestamps(rpc_client, reward, &epoch_schedule).await?;
    //             if let Some(cli_reward) = make_cli_reward(reward, epoch_start_time, epoch_end_time)
    //             {
    //                 all_epoch_rewards.push(cli_reward);
    //             }
    //         }
    //         Ok(())
    //     };

    while num_epochs > 0 && rewards_epoch > 0 {
        rewards_epoch = rewards_epoch.saturating_sub(1);
        if let Ok(rewards) = rpc_client
            .get_inflation_reward_with_config(&[*address], Some(rewards_epoch))
            .await
        {
            let reward = &rewards[0];
            if let Some(reward) = reward {
                let (epoch_start_time, epoch_end_time) =
                    get_epoch_boundary_timestamps(rpc_client, reward, &epoch_schedule).await?;
                if let Some(cli_reward) = make_cli_reward(reward, epoch_start_time, epoch_end_time)
                {
                    all_epoch_rewards.push(cli_reward);
                }
            }
        } else {
            PgTerminal::log_wasm(&format!(
                "Rewards not available for epoch {}",
                rewards_epoch
            ));
        }
        num_epochs = num_epochs.saturating_sub(1);
    }

    Ok(all_epoch_rewards)
}

pub async fn process_show_stake_account(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    stake_account_address: &Pubkey,
    use_lamports_unit: bool,
    with_rewards: Option<usize>,
) -> ProcessResult {
    let stake_account = rpc_client.get_account(stake_account_address).await?;
    if stake_account.owner != stake::program::id() {
        return Err(CliError::RpcRequestError(format!(
            "{:?} is not a stake account",
            stake_account_address,
        ))
        .into());
    }
    match stake_account.state() {
        Ok(stake_state) => {
            let stake_history_account = rpc_client.get_account(&stake_history::id()).await?;
            let stake_history = from_account(&stake_history_account).ok_or_else(|| {
                CliError::RpcRequestError("Failed to deserialize stake history".to_string())
            })?;
            let clock_account = rpc_client.get_account(&clock::id()).await?;
            let clock: Clock = from_account(&clock_account).ok_or_else(|| {
                CliError::RpcRequestError("Failed to deserialize clock sysvar".to_string())
            })?;

            let mut state = build_stake_state(
                stake_account.lamports,
                &stake_state,
                use_lamports_unit,
                &stake_history,
                &clock,
            );

            if state.stake_type == CliStakeType::Stake && state.activation_epoch.is_some() {
                // NOTE: async closures are unstable
                // let epoch_rewards = with_rewards.and_then(|num_epochs| {
                //     match fetch_epoch_rewards(rpc_client, stake_account_address, num_epochs) {
                //         Ok(rewards) => Some(rewards),
                //         Err(error) => {
                //             PgTerminal::log_wasm("Failed to fetch epoch rewards: {:?}", error);
                //             None
                //         }
                //     }
                // });
                let epoch_rewards = if with_rewards.is_some() {
                    match fetch_epoch_rewards(
                        rpc_client,
                        stake_account_address,
                        with_rewards.unwrap(),
                    )
                    .await
                    {
                        Ok(rewards) => Some(rewards),
                        Err(error) => {
                            PgTerminal::log_wasm(&format!(
                                "Failed to fetch epoch rewards: {:?}",
                                error
                            ));
                            None
                        }
                    }
                } else {
                    None
                };

                state.epoch_rewards = epoch_rewards;
            }
            Ok(config.output_format.formatted_string(&state))
        }
        Err(err) => Err(CliError::RpcRequestError(format!(
            "Account data could not be deserialized to stake state: {}",
            err
        ))
        .into()),
    }
}

pub async fn process_show_stake_history(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    use_lamports_unit: bool,
    limit_results: usize,
) -> ProcessResult {
    let stake_history_account = rpc_client.get_account(&stake_history::id()).await?;
    let stake_history =
        from_account::<StakeHistory, _>(&stake_history_account).ok_or_else(|| {
            CliError::RpcRequestError("Failed to deserialize stake history".to_string())
        })?;

    let limit_results = match config.output_format {
        OutputFormat::Json | OutputFormat::JsonCompact => usize::MAX,
        _ => {
            if limit_results == 0 {
                usize::MAX
            } else {
                limit_results
            }
        }
    };
    let mut entries: Vec<CliStakeHistoryEntry> = vec![];
    for entry in stake_history.deref().iter().take(limit_results) {
        entries.push(entry.into());
    }
    let stake_history_output = CliStakeHistory {
        entries,
        use_lamports_unit,
    };
    Ok(config.output_format.formatted_string(&stake_history_output))
}

// #[allow(clippy::too_many_arguments)]
// pub fn process_delegate_stake(
//     rpc_client: &WasmClient,
//     config: &CliConfig<'_>,
//     stake_account_pubkey: &Pubkey,
//     vote_account_pubkey: &Pubkey,
//     stake_authority: SignerIndex,
//     force: bool,
//     sign_only: bool,
//     dump_transaction_message: bool,
//     blockhash_query: &BlockhashQuery,
//     nonce_account: Option<Pubkey>,
//     nonce_authority: SignerIndex,
//     memo: Option<&String>,
//     fee_payer: SignerIndex,
// ) -> ProcessResult {
//     check_unique_pubkeys(
//         (&config.signers[0].pubkey(), "cli keypair".to_string()),
//         (stake_account_pubkey, "stake_account_pubkey".to_string()),
//     )?;
//     let stake_authority = config.signers[stake_authority];

//     if !sign_only {
//         // Sanity check the vote account to ensure it is attached to a validator that has recently
//         // voted at the tip of the ledger
//         let vote_account_data = rpc_client
//             .get_account(vote_account_pubkey)
//             .map_err(|err| {
//                 CliError::RpcRequestError(format!(
//                     "Vote account not found: {}. error: {}",
//                     vote_account_pubkey, err,
//                 ))
//             })?
//             .data;

//         let vote_state = VoteState::deserialize(&vote_account_data).map_err(|_| {
//             CliError::RpcRequestError(
//                 "Account data could not be deserialized to vote state".to_string(),
//             )
//         })?;

//         let sanity_check_result = match vote_state.root_slot {
//             None => Err(CliError::BadParameter(
//                 "Unable to delegate. Vote account has no root slot".to_string(),
//             )),
//             Some(root_slot) => {
//                 let min_root_slot = rpc_client
//                     .get_slot()?
//                     .saturating_sub(DELINQUENT_VALIDATOR_SLOT_DISTANCE);
//                 if root_slot < min_root_slot {
//                     Err(CliError::DynamicProgramError(format!(
//                         "Unable to delegate.  Vote account appears delinquent \
//                                  because its current root slot, {}, is less than {}",
//                         root_slot, min_root_slot
//                     )))
//                 } else {
//                     Ok(())
//                 }
//             }
//         };

//         if let Err(err) = &sanity_check_result {
//             if !force {
//                 sanity_check_result?;
//             } else {
//                 println!("--force supplied, ignoring: {}", err);
//             }
//         }
//     }

//     let recent_blockhash = blockhash_query.get_blockhash(rpc_client, config.commitment)?;

//     let ixs = vec![stake_instruction::delegate_stake(
//         stake_account_pubkey,
//         &stake_authority.pubkey(),
//         vote_account_pubkey,
//     )]
//     .with_memo(memo);
//     let nonce_authority = config.signers[nonce_authority];
//     let fee_payer = config.signers[fee_payer];

//     let message = if let Some(nonce_account) = &nonce_account {
//         Message::new_with_nonce(
//             ixs,
//             Some(&fee_payer.pubkey()),
//             nonce_account,
//             &nonce_authority.pubkey(),
//         )
//     } else {
//         Message::new(&ixs, Some(&fee_payer.pubkey()))
//     };
//     let mut tx = Transaction::new_unsigned(message);

//     if sign_only {
//         tx.try_partial_sign(&config.signers, recent_blockhash)?;
//         return_signers_with_config(
//             &tx,
//             &config.output_format,
//             &ReturnSignersConfig {
//                 dump_transaction_message,
//             },
//         )
//     } else {
//         tx.try_sign(&config.signers, recent_blockhash)?;
//         if let Some(nonce_account) = &nonce_account {
//             let nonce_account = nonce_utils::get_account_with_commitment(
//                 rpc_client,
//                 nonce_account,
//                 config.commitment,
//             )?;
//             check_nonce_account(&nonce_account, &nonce_authority.pubkey(), &recent_blockhash)?;
//         }
//         check_account_for_fee_with_commitment(
//             rpc_client,
//             &tx.message.account_keys[0],
//             &tx.message,
//             config.commitment,
//         )?;
//         let result = rpc_client.send_and_confirm_transaction_with_spinner(&tx);
//         log_instruction_custom_error::<StakeError>(result, config)
//     }
// }
