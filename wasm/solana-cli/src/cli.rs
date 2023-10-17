use std::{collections::HashMap, error, rc::Rc, time::Duration};

use clap::ArgMatches;
use num_traits::FromPrimitive;
use solana_clap_v3_utils_wasm::{
    input_parsers::value_of,
    keypair::{CliSigners, SignerIndex},
};
use solana_cli_output_wasm::cli_output::{
    get_name_value, CliSignature, CliValidatorsSortOrder, OutputFormat,
};
use solana_client_wasm::{
    utils::{
        nonce_utils,
        rpc_config::{BlockhashQuery, RpcLargestAccountsFilter, RpcSendTransactionConfig},
    },
    ClientError, WasmClient,
};
use solana_extra_wasm::program::vote::vote_state::VoteAuthorize;
use solana_playground_utils_wasm::js::PgTerminal;
use solana_remote_wallet::remote_wallet::RemoteWalletManager;
use solana_sdk::{
    clock::Epoch,
    commitment_config::{CommitmentConfig, CommitmentLevel},
    decode_error::DecodeError,
    instruction::InstructionError,
    pubkey::Pubkey,
    signature::Signature,
    signer::{Signer, SignerError},
    slot_history::Slot,
    transaction::VersionedTransaction,
};
use thiserror::Error;

use crate::{
    commands::{
        cluster_query::*, feature::*, inflation::*, nonce::*, program::*, stake::*, vote::*,
        wallet::*,
    },
    utils::spend_utils::SpendAmount,
};

pub const DEFAULT_RPC_TIMEOUT_SECONDS: &str = "30";
pub const DEFAULT_CONFIRM_TX_TIMEOUT_SECONDS: &str = "5";
const CHECKED: bool = true;

#[derive(Debug, PartialEq)]
#[allow(clippy::large_enum_variant)]
pub enum CliCommand {
    // // Cluster Query Commands
    // Catchup {
    //     node_pubkey: Option<Pubkey>,
    //     node_json_rpc_url: Option<String>,
    //     follow: bool,
    //     our_localhost_port: Option<u16>,
    //     log: bool,
    // },
    ClusterDate,
    ClusterVersion,
    Feature(FeatureCliCommand),
    Inflation(InflationCliCommand),
    // Fees {
    //     blockhash: Option<Hash>,
    // },
    FirstAvailableBlock,
    GetBlock {
        slot: Option<Slot>,
    },
    GetBlockTime {
        slot: Option<Slot>,
    },
    GetEpoch,
    GetEpochInfo,
    GetGenesisHash,
    GetSlot,
    GetBlockHeight,
    GetTransactionCount,
    LargestAccounts {
        filter: Option<RpcLargestAccountsFilter>,
    },
    // LeaderSchedule {
    //     epoch: Option<Epoch>,
    // },
    // LiveSlots,
    // Logs {
    //     filter: RpcTransactionLogsFilter,
    // },
    // Ping {
    //     interval: Duration,
    //     count: Option<u64>,
    //     timeout: Duration,
    //     blockhash: Option<Hash>,
    //     print_timestamp: bool,
    //     compute_unit_price: Option<u64>,
    // },
    Rent {
        data_length: usize,
        use_lamports_unit: bool,
    },
    ShowBlockProduction {
        epoch: Option<Epoch>,
        slot_limit: Option<u64>,
    },
    // ShowGossip,
    ShowStakes {
        use_lamports_unit: bool,
        vote_account_pubkeys: Option<Vec<Pubkey>>,
    },
    ShowValidators {
        use_lamports_unit: bool,
        sort_order: CliValidatorsSortOrder,
        reverse_sort: bool,
        number_validators: bool,
        keep_unstaked_delinquents: bool,
        delinquent_slot_distance: Option<Slot>,
    },
    Supply {
        print_accounts: bool,
    },
    TotalSupply,
    TransactionHistory {
        address: Pubkey,
        before: Option<Signature>,
        until: Option<Signature>,
        limit: usize,
        show_transactions: bool,
    },
    // WaitForMaxStake {
    //     max_stake_percent: f32,
    // },
    // Nonce commands
    AuthorizeNonceAccount {
        nonce_account: Pubkey,
        nonce_authority: SignerIndex,
        memo: Option<String>,
        new_authority: Pubkey,
    },
    CreateNonceAccount {
        nonce_account: SignerIndex,
        seed: Option<String>,
        nonce_authority: Option<Pubkey>,
        memo: Option<String>,
        amount: SpendAmount,
    },
    GetNonce(Pubkey),
    NewNonce {
        nonce_account: Pubkey,
        nonce_authority: SignerIndex,
        memo: Option<String>,
    },
    ShowNonceAccount {
        nonce_account_pubkey: Pubkey,
        use_lamports_unit: bool,
    },
    WithdrawFromNonceAccount {
        nonce_account: Pubkey,
        nonce_authority: SignerIndex,
        memo: Option<String>,
        destination_account_pubkey: Pubkey,
        lamports: u64,
    },
    // // Program Deployment
    // Deploy {
    //     program_location: String,
    //     address: Option<SignerIndex>,
    //     use_deprecated_loader: bool,
    //     allow_excessive_balance: bool,
    //     skip_fee_check: bool,
    // },
    Program(ProgramCliCommand),
    // // Stake Commands
    // CreateStakeAccount {
    //     stake_account: SignerIndex,
    //     seed: Option<String>,
    //     staker: Option<Pubkey>,
    //     withdrawer: Option<Pubkey>,
    //     withdrawer_signer: Option<SignerIndex>,
    //     lockup: Lockup,
    //     amount: SpendAmount,
    //     sign_only: bool,
    //     dump_transaction_message: bool,
    //     blockhash_query: BlockhashQuery,
    //     nonce_account: Option<Pubkey>,
    //     nonce_authority: SignerIndex,
    //     memo: Option<String>,
    //     fee_payer: SignerIndex,
    //     from: SignerIndex,
    // },
    // DeactivateStake {
    //     stake_account_pubkey: Pubkey,
    //     stake_authority: SignerIndex,
    //     sign_only: bool,
    //     deactivate_delinquent: bool,
    //     dump_transaction_message: bool,
    //     blockhash_query: BlockhashQuery,
    //     nonce_account: Option<Pubkey>,
    //     nonce_authority: SignerIndex,
    //     memo: Option<String>,
    //     seed: Option<String>,
    //     fee_payer: SignerIndex,
    // },
    // DelegateStake {
    //     stake_account_pubkey: Pubkey,
    //     vote_account_pubkey: Pubkey,
    //     stake_authority: SignerIndex,
    //     force: bool,
    //     sign_only: bool,
    //     dump_transaction_message: bool,
    //     blockhash_query: BlockhashQuery,
    //     nonce_account: Option<Pubkey>,
    //     nonce_authority: SignerIndex,
    //     memo: Option<String>,
    //     fee_payer: SignerIndex,
    // },
    // SplitStake {
    //     stake_account_pubkey: Pubkey,
    //     stake_authority: SignerIndex,
    //     sign_only: bool,
    //     dump_transaction_message: bool,
    //     blockhash_query: BlockhashQuery,
    //     nonce_account: Option<Pubkey>,
    //     nonce_authority: SignerIndex,
    //     memo: Option<String>,
    //     split_stake_account: SignerIndex,
    //     seed: Option<String>,
    //     lamports: u64,
    //     fee_payer: SignerIndex,
    // },
    // MergeStake {
    //     stake_account_pubkey: Pubkey,
    //     source_stake_account_pubkey: Pubkey,
    //     stake_authority: SignerIndex,
    //     sign_only: bool,
    //     dump_transaction_message: bool,
    //     blockhash_query: BlockhashQuery,
    //     nonce_account: Option<Pubkey>,
    //     nonce_authority: SignerIndex,
    //     memo: Option<String>,
    //     fee_payer: SignerIndex,
    // },
    ShowStakeHistory {
        use_lamports_unit: bool,
        limit_results: usize,
    },
    ShowStakeAccount {
        pubkey: Pubkey,
        use_lamports_unit: bool,
        with_rewards: Option<usize>,
    },
    // StakeAuthorize {
    //     stake_account_pubkey: Pubkey,
    //     new_authorizations: Vec<StakeAuthorizationIndexed>,
    //     sign_only: bool,
    //     dump_transaction_message: bool,
    //     blockhash_query: BlockhashQuery,
    //     nonce_account: Option<Pubkey>,
    //     nonce_authority: SignerIndex,
    //     memo: Option<String>,
    //     fee_payer: SignerIndex,
    //     custodian: Option<SignerIndex>,
    //     no_wait: bool,
    // },
    // StakeSetLockup {
    //     stake_account_pubkey: Pubkey,
    //     lockup: LockupArgs,
    //     custodian: SignerIndex,
    //     new_custodian_signer: Option<SignerIndex>,
    //     sign_only: bool,
    //     dump_transaction_message: bool,
    //     blockhash_query: BlockhashQuery,
    //     nonce_account: Option<Pubkey>,
    //     nonce_authority: SignerIndex,
    //     memo: Option<String>,
    //     fee_payer: SignerIndex,
    // },
    // WithdrawStake {
    //     stake_account_pubkey: Pubkey,
    //     destination_account_pubkey: Pubkey,
    //     amount: SpendAmount,
    //     withdraw_authority: SignerIndex,
    //     custodian: Option<SignerIndex>,
    //     sign_only: bool,
    //     dump_transaction_message: bool,
    //     blockhash_query: BlockhashQuery,
    //     nonce_account: Option<Pubkey>,
    //     nonce_authority: SignerIndex,
    //     memo: Option<String>,
    //     seed: Option<String>,
    //     fee_payer: SignerIndex,
    // },
    // // Validator Info Commands
    // GetValidatorInfo(Option<Pubkey>),
    // SetValidatorInfo {
    //     validator_info: Value,
    //     force_keybase: bool,
    //     info_pubkey: Option<Pubkey>,
    // },
    // // Vote Commands
    // CreateVoteAccount {
    //     vote_account: SignerIndex,
    //     seed: Option<String>,
    //     identity_account: SignerIndex,
    //     authorized_voter: Option<Pubkey>,
    //     authorized_withdrawer: Pubkey,
    //     commission: u8,
    //     sign_only: bool,
    //     dump_transaction_message: bool,
    //     blockhash_query: BlockhashQuery,
    //     nonce_account: Option<Pubkey>,
    //     nonce_authority: SignerIndex,
    //     memo: Option<String>,
    //     fee_payer: SignerIndex,
    // },
    ShowVoteAccount {
        pubkey: Pubkey,
        use_lamports_unit: bool,
        with_rewards: Option<usize>,
    },
    // WithdrawFromVoteAccount {
    //     vote_account_pubkey: Pubkey,
    //     destination_account_pubkey: Pubkey,
    //     withdraw_authority: SignerIndex,
    //     withdraw_amount: SpendAmount,
    //     sign_only: bool,
    //     dump_transaction_message: bool,
    //     blockhash_query: BlockhashQuery,
    //     nonce_account: Option<Pubkey>,
    //     nonce_authority: SignerIndex,
    //     memo: Option<String>,
    //     fee_payer: SignerIndex,
    // },
    // CloseVoteAccount {
    //     vote_account_pubkey: Pubkey,
    //     destination_account_pubkey: Pubkey,
    //     withdraw_authority: SignerIndex,
    //     memo: Option<String>,
    //     fee_payer: SignerIndex,
    // },
    VoteAuthorize {
        vote_account_pubkey: Pubkey,
        new_authorized_pubkey: Pubkey,
        vote_authorize: VoteAuthorize,
        sign_only: bool,
        dump_transaction_message: bool,
        blockhash_query: BlockhashQuery,
        nonce_account: Option<Pubkey>,
        nonce_authority: SignerIndex,
        memo: Option<String>,
        fee_payer: SignerIndex,
        authorized: SignerIndex,
        new_authorized: Option<SignerIndex>,
    },
    // VoteUpdateValidator {
    //     vote_account_pubkey: Pubkey,
    //     new_identity_account: SignerIndex,
    //     withdraw_authority: SignerIndex,
    //     sign_only: bool,
    //     dump_transaction_message: bool,
    //     blockhash_query: BlockhashQuery,
    //     nonce_account: Option<Pubkey>,
    //     nonce_authority: SignerIndex,
    //     memo: Option<String>,
    //     fee_payer: SignerIndex,
    // },
    // VoteUpdateCommission {
    //     vote_account_pubkey: Pubkey,
    //     commission: u8,
    //     withdraw_authority: SignerIndex,
    //     sign_only: bool,
    //     dump_transaction_message: bool,
    //     blockhash_query: BlockhashQuery,
    //     nonce_account: Option<Pubkey>,
    //     nonce_authority: SignerIndex,
    //     memo: Option<String>,
    //     fee_payer: SignerIndex,
    // },
    // Wallet Commands
    Address,
    Airdrop {
        pubkey: Option<Pubkey>,
        lamports: u64,
    },
    Balance {
        pubkey: Option<Pubkey>,
        use_lamports_unit: bool,
    },
    CreateAddressWithSeed {
        from_pubkey: Option<Pubkey>,
        seed: String,
        program_id: Pubkey,
    },
    Confirm(Signature),
    DecodeTransaction(VersionedTransaction),
    // ResolveSigner(Option<String>),
    ShowAccount {
        pubkey: Pubkey,
        output_file: Option<String>,
        use_lamports_unit: bool,
    },
    Transfer {
        amount: SpendAmount,
        to: Pubkey,
        from: SignerIndex,
        sign_only: bool,
        dump_transaction_message: bool,
        allow_unfunded_recipient: bool,
        no_wait: bool,
        blockhash_query: BlockhashQuery,
        nonce_account: Option<Pubkey>,
        nonce_authority: SignerIndex,
        memo: Option<String>,
        fee_payer: SignerIndex,
        derived_address_seed: Option<String>,
        derived_address_program_id: Option<Pubkey>,
    },
}

#[derive(Debug, PartialEq)]
pub struct CliCommandInfo {
    pub command: CliCommand,
    pub signers: CliSigners,
}

#[derive(Debug, Error)]
pub enum CliError {
    #[error("Bad parameter: {0}")]
    BadParameter(String),
    #[error(transparent)]
    ClientError(#[from] ClientError),
    #[error("Command not recognized: {0}")]
    CommandNotRecognized(String),
    #[error("Account {1} has insufficient funds for fee ({0} SOL)")]
    InsufficientFundsForFee(f64, Pubkey),
    #[error("Account {1} has insufficient funds for spend ({0} SOL)")]
    InsufficientFundsForSpend(f64, Pubkey),
    #[error("Account {2} has insufficient funds for spend ({0} SOL) + fee ({1} SOL)")]
    InsufficientFundsForSpendAndFee(f64, f64, Pubkey),
    #[error(transparent)]
    InvalidNonce(nonce_utils::NonceError),
    #[error("Dynamic program error: {0}")]
    DynamicProgramError(String),
    #[error("RPC request error: {0}")]
    RpcRequestError(String),
    #[error("Keypair file not found: {0}")]
    KeypairFileNotFound(String),
}

impl From<Box<dyn error::Error>> for CliError {
    fn from(error: Box<dyn error::Error>) -> Self {
        CliError::DynamicProgramError(error.to_string())
    }
}

impl From<nonce_utils::NonceError> for CliError {
    fn from(error: nonce_utils::NonceError) -> Self {
        match error {
            nonce_utils::NonceError::Client(client_error) => Self::RpcRequestError(client_error),
            _ => Self::InvalidNonce(error),
        }
    }
}

pub struct CliConfig<'a> {
    pub command: CliCommand,
    pub json_rpc_url: String,
    pub websocket_url: String,
    pub keypair_path: String,
    pub commitment_config: CommitmentConfig,
    pub signers: Vec<&'a dyn Signer>,
    // pub rpc_client: Option<Arc<WasmClient>>,
    pub rpc_timeout: Duration,
    pub verbose: bool,
    pub output_format: OutputFormat,
    pub send_transaction_config: RpcSendTransactionConfig,
    pub confirm_transaction_initial_timeout: Duration,
    pub address_labels: HashMap<String, String>,
}

impl CliConfig<'_> {
    pub fn pubkey(&self) -> Result<Pubkey, SignerError> {
        if !self.signers.is_empty() {
            self.signers[0].try_pubkey()
        } else {
            Err(SignerError::Custom(
                "Default keypair must be set if pubkey arg not provided".to_string(),
            ))
        }
    }

    pub fn commitment(&self) -> CommitmentLevel {
        self.commitment_config.commitment
    }
}

// impl Default for CliConfig<'_> {
//     fn default() -> CliConfig<'static> {
//         CliConfig {
//             command: CliCommand::Balance {
//                 pubkey: Some(Pubkey::default()),
//                 use_lamports_unit: false,
//             },
//             json_rpc_url: ConfigInput::default().json_rpc_url,
//             websocket_url: ConfigInput::default().websocket_url,
//             keypair_path: ConfigInput::default().keypair_path,
//             commitment: ConfigInput::default().commitment,
//             signers: Vec::new(),
//             rpc_client: None,
//             rpc_timeout: Duration::from_secs(u64::from_str(DEFAULT_RPC_TIMEOUT_SECONDS).unwrap()),
//             verbose: false,
//             output_format: OutputFormat::Display,
//             send_transaction_config: RpcSendTransactionConfig::default(),
//             confirm_transaction_initial_timeout: Duration::from_secs(
//                 u64::from_str(DEFAULT_CONFIRM_TX_TIMEOUT_SECONDS).unwrap(),
//             ),
//             address_labels: HashMap::new(),
//         }
//     }
// }

pub fn parse_command(
    matches: &ArgMatches,
    default_signer: Box<dyn Signer>,
    wallet_manager: &mut Option<Rc<RemoteWalletManager>>,
) -> Result<CliCommandInfo, Box<dyn error::Error>> {
    let response = match matches.subcommand() {
        // // Autocompletion Command
        // ("completion", Some(matches)) => {
        //     let shell_choice = match matches.value_of("shell") {
        //         Some("bash") => Shell::Bash,
        //         Some("fish") => Shell::Fish,
        //         Some("zsh") => Shell::Zsh,
        //         Some("powershell") => Shell::PowerShell,
        //         Some("elvish") => Shell::Elvish,
        //         // This is safe, since we assign default_value and possible_values
        //         // are restricted
        //         _ => unreachable!(),
        //     };
        //     get_clap_app(
        //         crate_name!(),
        //         crate_description!(),
        //         solana_version::version!(),
        //     )
        //     .gen_completions_to("solana", shell_choice, &mut stdout());
        //     std::process::exit(0);
        // }
        // // Cluster Query Commands
        Some(("block", matches)) => parse_get_block(matches),
        Some(("block-height", matches)) => parse_get_block_height(matches),
        Some(("block-production", matches)) => parse_show_block_production(matches),
        Some(("block-time", matches)) => parse_get_block_time(matches),
        // ("catchup", Some(matches)) => parse_catchup(matches, wallet_manager),
        Some(("cluster-date", _matches)) => Ok(CliCommandInfo {
            command: CliCommand::ClusterDate,
            signers: vec![],
        }),
        Some(("cluster-version", _matches)) => Ok(CliCommandInfo {
            command: CliCommand::ClusterVersion,
            signers: vec![],
        }),
        Some(("epoch", matches)) => parse_get_epoch(matches),
        Some(("epoch-info", matches)) => parse_get_epoch_info(matches),
        Some(("feature", matches)) => {
            parse_feature_subcommand(matches, default_signer, wallet_manager)
        }
        // ("fees", Some(matches)) => {
        //     let blockhash = value_of::<Hash>(matches, "blockhash");
        //     Ok(CliCommandInfo {
        //         command: CliCommand::Fees { blockhash },
        //         signers: vec![],
        //     })
        // }
        Some(("first-available-block", _matches)) => Ok(CliCommandInfo {
            command: CliCommand::FirstAvailableBlock,
            signers: vec![],
        }),
        Some(("genesis-hash", _matches)) => Ok(CliCommandInfo {
            command: CliCommand::GetGenesisHash,
            signers: vec![],
        }),
        // ("gossip", Some(_matches)) => Ok(CliCommandInfo {
        //     command: CliCommand::ShowGossip,
        //     signers: vec![],
        // }),
        Some(("inflation", matches)) => {
            parse_inflation_subcommand(matches, default_signer, wallet_manager)
        }
        Some(("largest-accounts", matches)) => parse_largest_accounts(matches),
        // ("leader-schedule", Some(matches)) => parse_leader_schedule(matches),
        // ("live-slots", Some(_matches)) => Ok(CliCommandInfo {
        //     command: CliCommand::LiveSlots,
        //     signers: vec![],
        // }),
        // ("logs", Some(matches)) => parse_logs(matches, wallet_manager),
        // ("ping", Some(matches)) => parse_cluster_ping(matches, default_signer, wallet_manager),
        Some(("rent", matches)) => {
            let data_length = value_of::<RentLengthValue>(matches, "data_length")
                .unwrap()
                .length();
            let use_lamports_unit = matches.is_present("lamports");
            Ok(CliCommandInfo {
                command: CliCommand::Rent {
                    data_length,
                    use_lamports_unit,
                },
                signers: vec![],
            })
        }
        Some(("slot", matches)) => parse_get_slot(matches),
        Some(("stakes", matches)) => parse_show_stakes(matches, wallet_manager),
        Some(("supply", matches)) => parse_supply(matches),
        Some(("total-supply", matches)) => parse_total_supply(matches),
        Some(("transaction-count", matches)) => parse_get_transaction_count(matches),
        Some(("transaction-history", matches)) => {
            parse_transaction_history(matches, wallet_manager)
        }
        Some(("validators", matches)) => parse_show_validators(matches),
        // Nonce Commands
        Some(("authorize-nonce-account", matches)) => {
            parse_authorize_nonce_account(matches, default_signer, wallet_manager)
        }
        Some(("create-nonce-account", matches)) => {
            parse_create_nonce_account(matches, default_signer, wallet_manager)
        }
        Some(("nonce", matches)) => parse_get_nonce(matches, wallet_manager),
        Some(("new-nonce", matches)) => parse_new_nonce(matches, default_signer, wallet_manager),
        Some(("nonce-account", matches)) => parse_show_nonce_account(matches, wallet_manager),
        Some(("withdraw-from-nonce-account", matches)) => {
            parse_withdraw_from_nonce_account(matches, default_signer, wallet_manager)
        }
        // Program Deployment
        // ("deploy", Some(matches)) => {
        //     let (address_signer, _address) = signer_of(matches, "address_signer", wallet_manager)?;
        //     let mut signers = vec![default_signer];
        //     let address = address_signer.map(|signer| {
        //         signers.push(signer);
        //         1
        //     });
        //     let skip_fee_check = matches.is_present("skip_fee_check");

        //     Ok(CliCommandInfo {
        //         command: CliCommand::Deploy {
        //             program_location: matches.value_of("program_location").unwrap().to_string(),
        //             address,
        //             use_deprecated_loader: matches.is_present("use_deprecated_loader"),
        //             allow_excessive_balance: matches.is_present("allow_excessive_balance"),
        //             skip_fee_check,
        //         },
        //         signers,
        //     })
        // }
        Some(("program", matches)) => {
            parse_program_subcommand(matches, default_signer, wallet_manager)
        }
        // ("wait-for-max-stake", Some(matches)) => {
        //     let max_stake_percent = value_t_or_exit!(matches, "max_percent", f32);
        //     Ok(CliCommandInfo {
        //         command: CliCommand::WaitForMaxStake { max_stake_percent },
        //         signers: vec![],
        //     })
        // }
        // // Stake Commands
        // ("create-stake-account", Some(matches)) => {
        //     parse_create_stake_account(matches, default_signer, wallet_manager, !CHECKED)
        // }
        // ("create-stake-account-checked", Some(matches)) => {
        //     parse_create_stake_account(matches, default_signer, wallet_manager, CHECKED)
        // }
        // ("delegate-stake", Some(matches)) => {
        //     parse_stake_delegate_stake(matches, default_signer, wallet_manager)
        // }
        // ("withdraw-stake", Some(matches)) => {
        //     parse_stake_withdraw_stake(matches, default_signer, wallet_manager)
        // }
        // ("deactivate-stake", Some(matches)) => {
        //     parse_stake_deactivate_stake(matches, default_signer, wallet_manager)
        // }
        // ("split-stake", Some(matches)) => {
        //     parse_split_stake(matches, default_signer, wallet_manager)
        // }
        // ("merge-stake", Some(matches)) => {
        //     parse_merge_stake(matches, default_signer, wallet_manager)
        // }
        // ("stake-authorize", Some(matches)) => {
        //     parse_stake_authorize(matches, default_signer, wallet_manager, !CHECKED)
        // }
        // ("stake-authorize-checked", Some(matches)) => {
        //     parse_stake_authorize(matches, default_signer, wallet_manager, CHECKED)
        // }
        // ("stake-set-lockup", Some(matches)) => {
        //     parse_stake_set_lockup(matches, default_signer, wallet_manager, !CHECKED)
        // }
        // ("stake-set-lockup-checked", Some(matches)) => {
        //     parse_stake_set_lockup(matches, default_signer, wallet_manager, CHECKED)
        // }
        Some(("stake-account", matches)) => parse_show_stake_account(matches, wallet_manager),
        Some(("stake-history", matches)) => parse_show_stake_history(matches),
        // // Validator Info Commands
        // ("validator-info", Some(matches)) => match matches.subcommand() {
        //     ("publish", Some(matches)) => {
        //         parse_validator_info_command(matches, default_signer, wallet_manager)
        //     }
        //     ("get", Some(matches)) => parse_get_validator_info_command(matches),
        //     _ => unreachable!(),
        // },
        // Vote Commands
        // ("create-vote-account", Some(matches)) => {
        //     parse_create_vote_account(matches, default_signer, wallet_manager)
        // }
        // ("vote-update-validator", Some(matches)) => {
        //     parse_vote_update_validator(matches, default_signer, wallet_manager)
        // }
        // ("vote-update-commission", Some(matches)) => {
        //     parse_vote_update_commission(matches, default_signer, wallet_manager)
        // }
        // ("vote-authorize-voter", Some(matches)) => parse_vote_authorize(
        //     matches,
        //     default_signer,
        //     wallet_manager,
        //     VoteAuthorize::Voter,
        //     !CHECKED,
        // ),
        // ("vote-authorize-withdrawer", Some(matches)) => parse_vote_authorize(
        //     matches,
        //     default_signer,
        //     wallet_manager,
        //     VoteAuthorize::Withdrawer,
        //     !CHECKED,
        // ),
        // ("vote-authorize-voter-checked", Some(matches)) => parse_vote_authorize(
        //     matches,
        //     default_signer,
        //     wallet_manager,
        //     VoteAuthorize::Voter,
        //     CHECKED,
        // ),
        Some(("vote-authorize-withdrawer-checked", matches)) => parse_vote_authorize(
            matches,
            default_signer,
            wallet_manager,
            VoteAuthorize::Withdrawer,
            CHECKED,
        ),
        Some(("vote-account", matches)) => parse_vote_get_account_command(matches, wallet_manager),
        // ("withdraw-from-vote-account", Some(matches)) => {
        //     parse_withdraw_from_vote_account(matches, default_signer, wallet_manager)
        // }
        // ("close-vote-account", Some(matches)) => {
        //     parse_close_vote_account(matches, default_signer, wallet_manager)
        // }
        // // Wallet Commands
        Some(("account", matches)) => parse_account(matches, wallet_manager),
        Some(("address", _matches)) => Ok(CliCommandInfo {
            command: CliCommand::Address,
            signers: vec![default_signer],
        }),
        Some(("airdrop", matches)) => parse_airdrop(matches, default_signer, wallet_manager),
        Some(("balance", matches)) => parse_balance(matches, default_signer, wallet_manager),
        Some(("confirm", matches)) => parse_confirm(matches),
        Some(("create-address-with-seed", matches)) => {
            parse_create_address_with_seed(matches, default_signer, wallet_manager)
        }
        Some(("decode-transaction", matches)) => parse_decode_transaction(matches),
        // Some(("resolve-signer", matches)) => {
        //     // TODO:
        //     let signer_path = resolve_signer(matches, "signer", wallet_manager)?;
        //     Ok(CliCommandInfo {
        //         command: CliCommand::ResolveSigner(signer_path),
        //         signers: vec![],
        //     })
        // }
        Some(("transfer", matches)) => parse_transfer(matches, default_signer, wallet_manager),
        //
        // ("", None) => {
        //     PgTerminal::log_wasm("{}", matches.usage());
        //     Err(CliError::CommandNotRecognized(
        //         "no subcommand given".to_string(),
        //     ))
        // }
        _ => unreachable!(),
    }?;
    Ok(response)
}

pub type ProcessResult = Result<String, Box<dyn std::error::Error>>;

pub async fn process_command(config: &CliConfig<'_>) -> ProcessResult {
    if config.verbose && config.output_format == OutputFormat::DisplayVerbose {
        let mut msg = String::new();
        let rpc_msg = format!("{}\n", get_name_value("RPC URL:", &config.json_rpc_url));
        let default_signer_msg = format!(
            "{}\n",
            get_name_value("Default Signer:", &config.keypair_path)
        );
        // if config.keypair_path.starts_with("usb://") {
        //     let pubkey = config
        //         .pubkey()
        //         .map(|pubkey| format!("{:?}", pubkey))
        //         .unwrap_or_else(|_| "Unavailable".to_string());
        //     PgTerminal::log_wasm(&format!("{}", get_name_value("Pubkey:", &pubkey)));
        // }
        let commitment_msg = get_name_value(
            "Commitment:",
            &config.commitment_config.commitment.to_string(),
        )
        .to_string();

        msg.push_str(&rpc_msg);
        msg.push_str(&default_signer_msg);
        msg.push_str(&commitment_msg);

        PgTerminal::log_wasm(&msg);
    }

    let rpc_client =
        WasmClient::new_with_commitment(&config.json_rpc_url, config.commitment_config);

    match &config.command {
        // // Cluster Query Commands
        // // Return software version of solana-cli and cluster entrypoint node
        // CliCommand::Catchup {
        //     node_pubkey,
        //     node_json_rpc_url,
        //     follow,
        //     our_localhost_port,
        //     log,
        // } => process_catchup(
        //     &rpc_client,
        //     config,
        //     *node_pubkey,
        //     node_json_rpc_url.clone(),
        //     *follow,
        //     *our_localhost_port,
        //     *log,
        // ),
        CliCommand::ClusterDate => process_cluster_date(&rpc_client, config).await,
        CliCommand::ClusterVersion => process_cluster_version(&rpc_client, config).await,
        // CliCommand::Fees { ref blockhash } => process_fees(&rpc_client, config, blockhash.as_ref()),
        CliCommand::Feature(feature_subcommand) => {
            process_feature_subcommand(&rpc_client, config, feature_subcommand).await
        }
        CliCommand::FirstAvailableBlock => process_first_available_block(&rpc_client).await,
        CliCommand::GetBlock { slot } => process_get_block(&rpc_client, config, *slot).await,
        CliCommand::GetBlockTime { slot } => {
            process_get_block_time(&rpc_client, config, *slot).await
        }
        CliCommand::GetEpoch => process_get_epoch(&rpc_client, config).await,
        CliCommand::GetEpochInfo => process_get_epoch_info(&rpc_client, config).await,
        CliCommand::GetGenesisHash => process_get_genesis_hash(&rpc_client).await,
        CliCommand::GetSlot => process_get_slot(&rpc_client, config).await,
        CliCommand::GetBlockHeight => process_get_block_height(&rpc_client, config).await,
        CliCommand::LargestAccounts { filter } => {
            process_largest_accounts(&rpc_client, config, filter.clone()).await
        }
        CliCommand::GetTransactionCount => process_get_transaction_count(&rpc_client, config).await,
        CliCommand::Inflation(inflation_subcommand) => {
            process_inflation_subcommand(&rpc_client, config, inflation_subcommand).await
        }
        // CliCommand::LeaderSchedule { epoch } => {
        //     process_leader_schedule(&rpc_client, config, *epoch)
        // }
        // CliCommand::LiveSlots => process_live_slots(config),
        // CliCommand::Logs { filter } => process_logs(config, filter),
        // CliCommand::Ping {
        //     interval,
        //     count,
        //     timeout,
        //     blockhash,
        //     print_timestamp,
        //     compute_unit_price,
        // } => process_ping(
        //     &rpc_client,
        //     config,
        //     interval,
        //     count,
        //     timeout,
        //     blockhash,
        //     *print_timestamp,
        //     compute_unit_price,
        // ),
        CliCommand::Rent {
            data_length,
            use_lamports_unit,
        } => process_calculate_rent(&rpc_client, config, *data_length, *use_lamports_unit).await,
        CliCommand::ShowBlockProduction { epoch, slot_limit } => {
            process_show_block_production(&rpc_client, config, *epoch, *slot_limit).await
        }
        // CliCommand::ShowGossip => process_show_gossip(&rpc_client, config),
        CliCommand::ShowStakes {
            use_lamports_unit,
            vote_account_pubkeys,
        } => {
            process_show_stakes(
                &rpc_client,
                config,
                *use_lamports_unit,
                vote_account_pubkeys.as_deref(),
            )
            .await
        }
        // CliCommand::WaitForMaxStake { max_stake_percent } => {
        //     process_wait_for_max_stake(&rpc_client, config, *max_stake_percent)
        // }
        CliCommand::ShowValidators {
            use_lamports_unit,
            sort_order,
            reverse_sort,
            number_validators,
            keep_unstaked_delinquents,
            delinquent_slot_distance,
        } => {
            process_show_validators(
                &rpc_client,
                config,
                *use_lamports_unit,
                *sort_order,
                *reverse_sort,
                *number_validators,
                *keep_unstaked_delinquents,
                *delinquent_slot_distance,
            )
            .await
        }
        CliCommand::Supply { print_accounts } => {
            process_supply(&rpc_client, config, *print_accounts).await
        }
        CliCommand::TotalSupply => process_total_supply(&rpc_client, config).await,
        CliCommand::TransactionHistory {
            address,
            before,
            until,
            limit,
            show_transactions,
        } => {
            process_transaction_history(
                &rpc_client,
                config,
                address,
                *before,
                *until,
                *limit,
                *show_transactions,
            )
            .await
        }

        // Nonce Commands

        // Assign authority to nonce account
        CliCommand::AuthorizeNonceAccount {
            nonce_account,
            nonce_authority,
            memo,
            new_authority,
        } => {
            process_authorize_nonce_account(
                &rpc_client,
                config,
                nonce_account,
                *nonce_authority,
                memo.as_ref(),
                new_authority,
            )
            .await
        }
        // Create nonce account
        CliCommand::CreateNonceAccount {
            nonce_account,
            seed,
            nonce_authority,
            memo,
            amount,
        } => {
            process_create_nonce_account(
                &rpc_client,
                config,
                *nonce_account,
                seed.clone(),
                *nonce_authority,
                memo.as_ref(),
                *amount,
            )
            .await
        }
        // Get the current nonce
        CliCommand::GetNonce(nonce_account_pubkey) => {
            process_get_nonce(&rpc_client, config, nonce_account_pubkey).await
        }
        // Get a new nonce
        CliCommand::NewNonce {
            nonce_account,
            nonce_authority,
            memo,
        } => {
            process_new_nonce(
                &rpc_client,
                config,
                nonce_account,
                *nonce_authority,
                memo.as_ref(),
            )
            .await
        }
        // Show the contents of a nonce account
        CliCommand::ShowNonceAccount {
            nonce_account_pubkey,
            use_lamports_unit,
        } => {
            process_show_nonce_account(
                &rpc_client,
                config,
                nonce_account_pubkey,
                *use_lamports_unit,
            )
            .await
        }
        // Withdraw lamports from a nonce account
        CliCommand::WithdrawFromNonceAccount {
            nonce_account,
            nonce_authority,
            memo,
            destination_account_pubkey,
            lamports,
        } => {
            process_withdraw_from_nonce_account(
                &rpc_client,
                config,
                nonce_account,
                *nonce_authority,
                memo.as_ref(),
                destination_account_pubkey,
                *lamports,
            )
            .await
        }

        // // Program Deployment

        // // Deploy a custom program to the chain
        // CliCommand::Deploy {
        //     program_location,
        //     address,
        //     use_deprecated_loader,
        //     allow_excessive_balance,
        //     skip_fee_check,
        // } => process_deploy(
        //     rpc_client,
        //     config,
        //     program_location,
        //     *address,
        //     *use_deprecated_loader,
        //     *allow_excessive_balance,
        //     *skip_fee_check,
        // ),
        CliCommand::Program(program_subcommand) => {
            process_program_subcommand(&rpc_client, config, program_subcommand).await
        }

        // // Stake Commands

        // // Create stake account
        // CliCommand::CreateStakeAccount {
        //     stake_account,
        //     seed,
        //     staker,
        //     withdrawer,
        //     withdrawer_signer,
        //     lockup,
        //     amount,
        //     sign_only,
        //     dump_transaction_message,
        //     blockhash_query,
        //     ref nonce_account,
        //     nonce_authority,
        //     memo,
        //     fee_payer,
        //     from,
        // } => process_create_stake_account(
        //     &rpc_client,
        //     config,
        //     *stake_account,
        //     seed,
        //     staker,
        //     withdrawer,
        //     *withdrawer_signer,
        //     lockup,
        //     *amount,
        //     *sign_only,
        //     *dump_transaction_message,
        //     blockhash_query,
        //     nonce_account.as_ref(),
        //     *nonce_authority,
        //     memo.as_ref(),
        //     *fee_payer,
        //     *from,
        // ),
        // CliCommand::DeactivateStake {
        //     stake_account_pubkey,
        //     stake_authority,
        //     sign_only,
        //     deactivate_delinquent,
        //     dump_transaction_message,
        //     blockhash_query,
        //     nonce_account,
        //     nonce_authority,
        //     memo,
        //     seed,
        //     fee_payer,
        // } => process_deactivate_stake_account(
        //     &rpc_client,
        //     config,
        //     stake_account_pubkey,
        //     *stake_authority,
        //     *sign_only,
        //     *deactivate_delinquent,
        //     *dump_transaction_message,
        //     blockhash_query,
        //     *nonce_account,
        //     *nonce_authority,
        //     memo.as_ref(),
        //     seed.as_ref(),
        //     *fee_payer,
        // ),
        // CliCommand::DelegateStake {
        //     stake_account_pubkey,
        //     vote_account_pubkey,
        //     stake_authority,
        //     force,
        //     sign_only,
        //     dump_transaction_message,
        //     blockhash_query,
        //     nonce_account,
        //     nonce_authority,
        //     memo,
        //     fee_payer,
        // } => process_delegate_stake(
        //     &rpc_client,
        //     config,
        //     stake_account_pubkey,
        //     vote_account_pubkey,
        //     *stake_authority,
        //     *force,
        //     *sign_only,
        //     *dump_transaction_message,
        //     blockhash_query,
        //     *nonce_account,
        //     *nonce_authority,
        //     memo.as_ref(),
        //     *fee_payer,
        // ),
        // CliCommand::SplitStake {
        //     stake_account_pubkey,
        //     stake_authority,
        //     sign_only,
        //     dump_transaction_message,
        //     blockhash_query,
        //     nonce_account,
        //     nonce_authority,
        //     memo,
        //     split_stake_account,
        //     seed,
        //     lamports,
        //     fee_payer,
        // } => process_split_stake(
        //     &rpc_client,
        //     config,
        //     stake_account_pubkey,
        //     *stake_authority,
        //     *sign_only,
        //     *dump_transaction_message,
        //     blockhash_query,
        //     *nonce_account,
        //     *nonce_authority,
        //     memo.as_ref(),
        //     *split_stake_account,
        //     seed,
        //     *lamports,
        //     *fee_payer,
        // ),
        // CliCommand::MergeStake {
        //     stake_account_pubkey,
        //     source_stake_account_pubkey,
        //     stake_authority,
        //     sign_only,
        //     dump_transaction_message,
        //     blockhash_query,
        //     nonce_account,
        //     nonce_authority,
        //     memo,
        //     fee_payer,
        // } => process_merge_stake(
        //     &rpc_client,
        //     config,
        //     stake_account_pubkey,
        //     source_stake_account_pubkey,
        //     *stake_authority,
        //     *sign_only,
        //     *dump_transaction_message,
        //     blockhash_query,
        //     *nonce_account,
        //     *nonce_authority,
        //     memo.as_ref(),
        //     *fee_payer,
        // ),
        CliCommand::ShowStakeAccount {
            pubkey: stake_account_pubkey,
            use_lamports_unit,
            with_rewards,
        } => {
            process_show_stake_account(
                &rpc_client,
                config,
                stake_account_pubkey,
                *use_lamports_unit,
                *with_rewards,
            )
            .await
        }
        CliCommand::ShowStakeHistory {
            use_lamports_unit,
            limit_results,
        } => {
            process_show_stake_history(&rpc_client, config, *use_lamports_unit, *limit_results)
                .await
        }
        // CliCommand::StakeAuthorize {
        //     stake_account_pubkey,
        //     ref new_authorizations,
        //     sign_only,
        //     dump_transaction_message,
        //     blockhash_query,
        //     nonce_account,
        //     nonce_authority,
        //     memo,
        //     fee_payer,
        //     custodian,
        //     no_wait,
        // } => process_stake_authorize(
        //     &rpc_client,
        //     config,
        //     stake_account_pubkey,
        //     new_authorizations,
        //     *custodian,
        //     *sign_only,
        //     *dump_transaction_message,
        //     blockhash_query,
        //     *nonce_account,
        //     *nonce_authority,
        //     memo.as_ref(),
        //     *fee_payer,
        //     *no_wait,
        // ),
        // CliCommand::StakeSetLockup {
        //     stake_account_pubkey,
        //     lockup,
        //     custodian,
        //     new_custodian_signer,
        //     sign_only,
        //     dump_transaction_message,
        //     blockhash_query,
        //     nonce_account,
        //     nonce_authority,
        //     memo,
        //     fee_payer,
        // } => process_stake_set_lockup(
        //     &rpc_client,
        //     config,
        //     stake_account_pubkey,
        //     lockup,
        //     *new_custodian_signer,
        //     *custodian,
        //     *sign_only,
        //     *dump_transaction_message,
        //     blockhash_query,
        //     *nonce_account,
        //     *nonce_authority,
        //     memo.as_ref(),
        //     *fee_payer,
        // ),
        // CliCommand::WithdrawStake {
        //     stake_account_pubkey,
        //     destination_account_pubkey,
        //     amount,
        //     withdraw_authority,
        //     custodian,
        //     sign_only,
        //     dump_transaction_message,
        //     blockhash_query,
        //     ref nonce_account,
        //     nonce_authority,
        //     memo,
        //     seed,
        //     fee_payer,
        // } => process_withdraw_stake(
        //     &rpc_client,
        //     config,
        //     stake_account_pubkey,
        //     destination_account_pubkey,
        //     *amount,
        //     *withdraw_authority,
        //     *custodian,
        //     *sign_only,
        //     *dump_transaction_message,
        //     blockhash_query,
        //     nonce_account.as_ref(),
        //     *nonce_authority,
        //     memo.as_ref(),
        //     seed.as_ref(),
        //     *fee_payer,
        // ),

        // // Validator Info Commands

        // // Return all or single validator info
        // CliCommand::GetValidatorInfo(info_pubkey) => {
        //     process_get_validator_info(&rpc_client, config, *info_pubkey)
        // }
        // // Publish validator info
        // CliCommand::SetValidatorInfo {
        //     validator_info,
        //     force_keybase,
        //     info_pubkey,
        // } => process_set_validator_info(
        //     &rpc_client,
        //     config,
        //     validator_info,
        //     *force_keybase,
        //     *info_pubkey,
        // ),

        // // Vote Commands

        // // Create vote account
        // CliCommand::CreateVoteAccount {
        //     vote_account,
        //     seed,
        //     identity_account,
        //     authorized_voter,
        //     authorized_withdrawer,
        //     commission,
        //     sign_only,
        //     dump_transaction_message,
        //     blockhash_query,
        //     ref nonce_account,
        //     nonce_authority,
        //     memo,
        //     fee_payer,
        // } => process_create_vote_account(
        //     &rpc_client,
        //     config,
        //     *vote_account,
        //     seed,
        //     *identity_account,
        //     authorized_voter,
        //     *authorized_withdrawer,
        //     *commission,
        //     *sign_only,
        //     *dump_transaction_message,
        //     blockhash_query,
        //     nonce_account.as_ref(),
        //     *nonce_authority,
        //     memo.as_ref(),
        //     *fee_payer,
        // ),
        CliCommand::ShowVoteAccount {
            pubkey: vote_account_pubkey,
            use_lamports_unit,
            with_rewards,
        } => {
            process_show_vote_account(
                &rpc_client,
                config,
                vote_account_pubkey,
                *use_lamports_unit,
                *with_rewards,
            )
            .await
        }
        // CliCommand::WithdrawFromVoteAccount {
        //     vote_account_pubkey,
        //     withdraw_authority,
        //     withdraw_amount,
        //     destination_account_pubkey,
        //     sign_only,
        //     dump_transaction_message,
        //     blockhash_query,
        //     ref nonce_account,
        //     nonce_authority,
        //     memo,
        //     fee_payer,
        // } => process_withdraw_from_vote_account(
        //     &rpc_client,
        //     config,
        //     vote_account_pubkey,
        //     *withdraw_authority,
        //     *withdraw_amount,
        //     destination_account_pubkey,
        //     *sign_only,
        //     *dump_transaction_message,
        //     blockhash_query,
        //     nonce_account.as_ref(),
        //     *nonce_authority,
        //     memo.as_ref(),
        //     *fee_payer,
        // ),
        // CliCommand::CloseVoteAccount {
        //     vote_account_pubkey,
        //     withdraw_authority,
        //     destination_account_pubkey,
        //     memo,
        //     fee_payer,
        // } => process_close_vote_account(
        //     &rpc_client,
        //     config,
        //     vote_account_pubkey,
        //     *withdraw_authority,
        //     destination_account_pubkey,
        //     memo.as_ref(),
        //     *fee_payer,
        // ),
        CliCommand::VoteAuthorize {
            vote_account_pubkey,
            new_authorized_pubkey,
            vote_authorize,
            sign_only,
            dump_transaction_message,
            blockhash_query,
            nonce_account,
            nonce_authority,
            memo,
            fee_payer,
            authorized,
            new_authorized,
        } => {
            process_vote_authorize(
                &rpc_client,
                config,
                vote_account_pubkey,
                new_authorized_pubkey,
                *vote_authorize,
                *authorized,
                *new_authorized,
                *sign_only,
                *dump_transaction_message,
                blockhash_query,
                *nonce_account,
                *nonce_authority,
                memo.as_ref(),
                *fee_payer,
            )
            .await
        }
        // CliCommand::VoteUpdateValidator {
        //     vote_account_pubkey,
        //     new_identity_account,
        //     withdraw_authority,
        //     sign_only,
        //     dump_transaction_message,
        //     blockhash_query,
        //     nonce_account,
        //     nonce_authority,
        //     memo,
        //     fee_payer,
        // } => process_vote_update_validator(
        //     &rpc_client,
        //     config,
        //     vote_account_pubkey,
        //     *new_identity_account,
        //     *withdraw_authority,
        //     *sign_only,
        //     *dump_transaction_message,
        //     blockhash_query,
        //     *nonce_account,
        //     *nonce_authority,
        //     memo.as_ref(),
        //     *fee_payer,
        // ),
        // CliCommand::VoteUpdateCommission {
        //     vote_account_pubkey,
        //     commission,
        //     withdraw_authority,
        //     sign_only,
        //     dump_transaction_message,
        //     blockhash_query,
        //     nonce_account,
        //     nonce_authority,
        //     memo,
        //     fee_payer,
        // } => process_vote_update_commission(
        //     &rpc_client,
        //     config,
        //     vote_account_pubkey,
        //     *commission,
        //     *withdraw_authority,
        //     *sign_only,
        //     *dump_transaction_message,
        //     blockhash_query,
        //     *nonce_account,
        //     *nonce_authority,
        //     memo.as_ref(),
        //     *fee_payer,
        // ),

        // Wallet Commands

        // Request an airdrop from Solana Faucet;
        CliCommand::Airdrop { pubkey, lamports } => {
            process_airdrop(&rpc_client, config, pubkey, *lamports).await
        }
        // Get address of this client
        CliCommand::Address => Ok(format!("{}", config.pubkey()?)),
        // Check client balance
        CliCommand::Balance {
            pubkey,
            use_lamports_unit,
        } => process_balance(&rpc_client, config, pubkey, *use_lamports_unit).await,
        // Confirm the last client transaction by signature
        CliCommand::Confirm(signature) => process_confirm(&rpc_client, config, signature).await,
        CliCommand::CreateAddressWithSeed {
            from_pubkey,
            seed,
            program_id,
        } => process_create_address_with_seed(config, from_pubkey.as_ref(), seed, program_id),
        CliCommand::DecodeTransaction(transaction) => {
            process_decode_transaction(config, transaction)
        }
        // CliCommand::ResolveSigner(path) => {
        //     if let Some(path) = path {
        //         Ok(path.to_string())
        //     } else {
        //         Ok("Signer is valid".to_string())
        //     }
        // }
        CliCommand::ShowAccount {
            pubkey,
            output_file,
            use_lamports_unit,
        } => {
            process_show_account(&rpc_client, config, pubkey, output_file, *use_lamports_unit).await
        }
        CliCommand::Transfer {
            amount,
            to,
            from,
            sign_only,
            dump_transaction_message,
            allow_unfunded_recipient,
            no_wait,
            ref blockhash_query,
            ref nonce_account,
            nonce_authority,
            memo,
            fee_payer,
            derived_address_seed,
            ref derived_address_program_id,
        } => {
            process_transfer(
                &rpc_client,
                config,
                *amount,
                to,
                *from,
                *sign_only,
                *dump_transaction_message,
                *allow_unfunded_recipient,
                *no_wait,
                blockhash_query,
                nonce_account.as_ref(),
                *nonce_authority,
                memo.as_ref(),
                *fee_payer,
                derived_address_seed.clone(),
                derived_address_program_id.as_ref(),
            )
            .await
        }
    }
}

pub type SignatureResult = Result<Signature, ClientError>;

fn common_error_adapter<E>(ix_error: &InstructionError) -> Option<E>
where
    E: 'static + std::error::Error + DecodeError<E> + FromPrimitive,
{
    if let InstructionError::Custom(code) = ix_error {
        E::decode_custom_error_to_enum(*code)
    } else {
        None
    }
}

pub fn log_instruction_custom_error<E>(result: SignatureResult, config: &CliConfig) -> ProcessResult
where
    E: 'static + std::error::Error + DecodeError<E> + FromPrimitive,
{
    log_instruction_custom_error_ex::<E, _>(result, config, common_error_adapter)
}

pub fn log_instruction_custom_error_ex<E, F>(
    result: SignatureResult,
    config: &CliConfig<'_>,
    _error_adapter: F,
) -> ProcessResult
where
    E: 'static + std::error::Error + DecodeError<E> + FromPrimitive,
    F: Fn(&InstructionError) -> Option<E>,
{
    match result {
        Err(err) => {
            // TODO:
            // let maybe_tx_err = err.get_transaction_error();
            // if let Some(TransactionError::InstructionError(_, ix_error)) = maybe_tx_err {
            //     if let Some(specific_error) = error_adapter(&ix_error) {
            //         return Err(specific_error.into());
            //     }
            // }
            Err(err.into())
        }
        Ok(sig) => {
            let signature = CliSignature {
                signature: sig.clone().to_string(),
            };
            Ok(config.output_format.formatted_string(&signature))
        }
    }
}
