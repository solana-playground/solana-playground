use clap::{Arg, ArgMatches, Command};
use solana_clap_v3_utils_wasm::{
    input_parsers::*,
    input_validators::*,
    keypair::{generate_unique_signers, SignerIndex},
    memo::{memo_arg, MEMO_ARG},
    nonce::*,
};
use solana_cli_output_wasm::cli_output::CliNonceAccount;
use solana_client_wasm::{
    utils::nonce_utils::{self, state_from_account, NonceError as ClientNonceError},
    WasmClient,
};
use solana_playground_utils_wasm::js::PgTerminal;
use solana_remote_wallet::remote_wallet::RemoteWalletManager;
use solana_sdk::{
    account::Account,
    feature_set::merge_nonce_error_into_system_error,
    hash::Hash,
    message::Message,
    native_token::lamports_to_sol,
    nonce::{self, State},
    pubkey::Pubkey,
    signature::Keypair,
    signer::Signer,
    system_instruction::{
        advance_nonce_account, authorize_nonce_account, create_nonce_account,
        create_nonce_account_with_seed, withdraw_nonce_account, SystemError,
    },
    system_program,
    transaction::Transaction,
};
use std::rc::Rc;

use crate::{
    cli::{
        log_instruction_custom_error, CliCommand, CliCommandInfo, CliConfig, CliError,
        ProcessResult,
    },
    utils::{
        checks::{check_account_for_fee_with_commitment, check_unique_pubkeys},
        memo::WithMemo,
        spend_utils::{resolve_spend_tx_and_check_account_balance, SpendAmount},
    },
};

use super::feature::get_feature_is_active;

pub trait NonceSubCommands {
    fn nonce_subcommands(self) -> Self;
}

impl NonceSubCommands for Command<'_> {
    fn nonce_subcommands(self) -> Self {
        self.subcommand(
            Command::new("authorize-nonce-account")
                .about("Assign account authority to a new entity")
                .arg(pubkey!(
                    Arg::new("nonce_account_pubkey")
                        .index(1)
                        .value_name("NONCE_ACCOUNT_ADDRESS")
                        .required(true),
                    "Address of the nonce account. "
                ))
                .arg(pubkey!(
                    Arg::new("new_authority")
                        .index(2)
                        .value_name("AUTHORITY_PUBKEY")
                        .required(true),
                    "Account to be granted authority of the nonce account. "
                ))
                .arg(nonce_authority_arg())
                .arg(memo_arg()),
        )
                .subcommand(
                    Command::new("create-nonce-account")
                        .about("Create a nonce account")
                        // NOTE: We generate a keypair randomly for WASM
                        // .arg(
                        //     Arg::new("nonce_account_keypair")
                        //         .index(1)
                        //         .value_name("ACCOUNT_KEYPAIR")
                        //         .takes_value(true)
                        //         .required(true)
                        //         .validator(is_valid_signer)
                        //         .help("Keypair of the nonce account to fund"),
                        // )
                        .arg(
                            Arg::new("amount")
                                .index(1)
                                .value_name("AMOUNT")
                                .takes_value(true)
                                .required(true)
                                .validator(is_amount_or_all)
                                .help("The amount to load the nonce account with, in SOL; accepts keyword ALL"),
                        )
                        .arg(
                            pubkey!(Arg::new(NONCE_AUTHORITY_ARG.name)
                                .long(NONCE_AUTHORITY_ARG.long)
                                .value_name("PUBKEY"),
                                "Assign noncing authority to another entity. "),
                        )
                        .arg(
                            Arg::new("seed")
                                .long("seed")
                                .value_name("STRING")
                                .takes_value(true)
                                .help("Seed for address generation; if specified, the resulting account will be at a derived address of the NONCE_ACCOUNT pubkey")
                        )
                        .arg(memo_arg()),
                )
        .subcommand(
            Command::new("nonce")
                .about("Get the current nonce value")
                .alias("get-nonce")
                .arg(pubkey!(
                    Arg::new("nonce_account_pubkey")
                        .index(1)
                        .value_name("NONCE_ACCOUNT_ADDRESS")
                        .required(true),
                    "Address of the nonce account to display. "
                )),
        )
        .subcommand(
            Command::new("new-nonce")
                .about("Generate a new nonce, rendering the existing nonce useless")
                .arg(pubkey!(
                    Arg::new("nonce_account_pubkey")
                        .index(1)
                        .value_name("NONCE_ACCOUNT_ADDRESS")
                        .required(true),
                    "Address of the nonce account. "
                ))
                .arg(nonce_authority_arg())
                .arg(memo_arg()),
        )
        .subcommand(
            Command::new("nonce-account")
                .about("Show the contents of a nonce account")
                .alias("show-nonce-account")
                .arg(pubkey!(
                    Arg::new("nonce_account_pubkey")
                        .index(1)
                        .value_name("NONCE_ACCOUNT_ADDRESS")
                        .required(true),
                    "Address of the nonce account to display. "
                ))
                .arg(
                    Arg::new("lamports")
                        .long("lamports")
                        .takes_value(false)
                        .help("Display balance in lamports instead of SOL"),
                ),
        )
        .subcommand(
            Command::new("withdraw-from-nonce-account")
                .about("Withdraw SOL from the nonce account")
                .arg(pubkey!(
                    Arg::new("nonce_account_pubkey")
                        .index(1)
                        .value_name("NONCE_ACCOUNT_ADDRESS")
                        .required(true),
                    "Nonce account to withdraw from. "
                ))
                .arg(pubkey!(
                    Arg::new("destination_account_pubkey")
                        .index(2)
                        .value_name("RECIPIENT_ADDRESS")
                        .required(true),
                    "The account to which the SOL should be transferred. "
                ))
                .arg(
                    Arg::new("amount")
                        .index(3)
                        .value_name("AMOUNT")
                        .takes_value(true)
                        .required(true)
                        .validator(is_amount)
                        .help("The amount to withdraw from the nonce account, in SOL"),
                )
                .arg(nonce_authority_arg())
                .arg(memo_arg()),
        )
    }
}

pub fn parse_authorize_nonce_account(
    matches: &ArgMatches,
    default_signer: Box<dyn Signer>,
    wallet_manager: &mut Option<Rc<RemoteWalletManager>>,
) -> Result<CliCommandInfo, CliError> {
    let nonce_account = pubkey_of_signer(matches, "nonce_account_pubkey", wallet_manager)?.unwrap();
    let new_authority = pubkey_of_signer(matches, "new_authority", wallet_manager)?.unwrap();
    let memo = matches.value_of(MEMO_ARG.name).map(String::from);
    let (nonce_authority, nonce_authority_pubkey) =
        signer_of(matches, NONCE_AUTHORITY_ARG.name, wallet_manager)?;

    let payer_provided = None;
    let signer_info =
        generate_unique_signers(default_signer, vec![payer_provided, nonce_authority])?;

    Ok(CliCommandInfo {
        command: CliCommand::AuthorizeNonceAccount {
            nonce_account,
            nonce_authority: signer_info.index_of(nonce_authority_pubkey).unwrap(),
            memo,
            new_authority,
        },
        signers: signer_info.signers,
    })
}

pub fn parse_create_nonce_account(
    matches: &ArgMatches,
    default_signer: Box<dyn Signer>,
    wallet_manager: &mut Option<Rc<RemoteWalletManager>>,
) -> Result<CliCommandInfo, CliError> {
    // NOTE: We generate a random keypair instead for WASM
    // let (nonce_account, nonce_account_pubkey) =
    //     signer_of(matches, "nonce_account_keypair", wallet_manager)?;

    let nonce_account = Keypair::new();
    let nonce_account_pubkey = nonce_account.pubkey();

    let seed = matches.value_of("seed").map(|s| s.to_string());
    let amount = SpendAmount::new_from_matches(matches, "amount");
    let nonce_authority = pubkey_of_signer(matches, NONCE_AUTHORITY_ARG.name, wallet_manager)?;
    let memo = matches.value_of(MEMO_ARG.name).map(String::from);

    let payer_provided = None;
    let signer_info = generate_unique_signers(
        default_signer,
        vec![payer_provided, Some(Box::new(nonce_account))],
    )?;

    Ok(CliCommandInfo {
        command: CliCommand::CreateNonceAccount {
            nonce_account: signer_info.index_of(Some(nonce_account_pubkey)).unwrap(),
            seed,
            nonce_authority,
            memo,
            amount,
        },
        signers: signer_info.signers,
    })
}

pub fn parse_get_nonce(
    matches: &ArgMatches,
    wallet_manager: &mut Option<Rc<RemoteWalletManager>>,
) -> Result<CliCommandInfo, CliError> {
    let nonce_account_pubkey =
        pubkey_of_signer(matches, "nonce_account_pubkey", wallet_manager)?.unwrap();

    Ok(CliCommandInfo {
        command: CliCommand::GetNonce(nonce_account_pubkey),
        signers: vec![],
    })
}

pub fn parse_new_nonce(
    matches: &ArgMatches,
    default_signer: Box<dyn Signer>,
    wallet_manager: &mut Option<Rc<RemoteWalletManager>>,
) -> Result<CliCommandInfo, CliError> {
    let nonce_account = pubkey_of_signer(matches, "nonce_account_pubkey", wallet_manager)?.unwrap();
    let memo = matches.value_of(MEMO_ARG.name).map(String::from);
    let (nonce_authority, nonce_authority_pubkey) =
        signer_of(matches, NONCE_AUTHORITY_ARG.name, wallet_manager)?;

    let payer_provided = None;
    let signer_info =
        generate_unique_signers(default_signer, vec![payer_provided, nonce_authority])?;

    Ok(CliCommandInfo {
        command: CliCommand::NewNonce {
            nonce_account,
            nonce_authority: signer_info.index_of(nonce_authority_pubkey).unwrap(),
            memo,
        },
        signers: signer_info.signers,
    })
}

pub fn parse_show_nonce_account(
    matches: &ArgMatches,
    wallet_manager: &mut Option<Rc<RemoteWalletManager>>,
) -> Result<CliCommandInfo, CliError> {
    let nonce_account_pubkey =
        pubkey_of_signer(matches, "nonce_account_pubkey", wallet_manager)?.unwrap();
    let use_lamports_unit = matches.is_present("lamports");

    Ok(CliCommandInfo {
        command: CliCommand::ShowNonceAccount {
            nonce_account_pubkey,
            use_lamports_unit,
        },
        signers: vec![],
    })
}

pub fn parse_withdraw_from_nonce_account(
    matches: &ArgMatches,
    default_signer: Box<dyn Signer>,
    wallet_manager: &mut Option<Rc<RemoteWalletManager>>,
) -> Result<CliCommandInfo, CliError> {
    let nonce_account = pubkey_of_signer(matches, "nonce_account_pubkey", wallet_manager)?.unwrap();
    let destination_account_pubkey =
        pubkey_of_signer(matches, "destination_account_pubkey", wallet_manager)?.unwrap();
    let lamports = lamports_of_sol(matches, "amount").unwrap();
    let memo = matches.value_of(MEMO_ARG.name).map(String::from);
    let (nonce_authority, nonce_authority_pubkey) =
        signer_of(matches, NONCE_AUTHORITY_ARG.name, wallet_manager)?;

    let payer_provided = None;
    let signer_info =
        generate_unique_signers(default_signer, vec![payer_provided, nonce_authority])?;

    Ok(CliCommandInfo {
        command: CliCommand::WithdrawFromNonceAccount {
            nonce_account,
            nonce_authority: signer_info.index_of(nonce_authority_pubkey).unwrap(),
            memo,
            destination_account_pubkey,
            lamports,
        },
        signers: signer_info.signers,
    })
}

/// Check if a nonce account is initialized with the given authority and hash
pub fn check_nonce_account(
    nonce_account: &Account,
    nonce_authority: &Pubkey,
    nonce_hash: &Hash,
) -> Result<(), CliError> {
    match state_from_account(nonce_account)? {
        State::Initialized(ref data) => {
            if &data.blockhash() != nonce_hash {
                Err(ClientNonceError::InvalidHash {
                    provided: *nonce_hash,
                    expected: data.blockhash(),
                }
                .into())
            } else if nonce_authority != &data.authority {
                Err(ClientNonceError::InvalidAuthority {
                    provided: *nonce_authority,
                    expected: data.authority,
                }
                .into())
            } else {
                Ok(())
            }
        }
        State::Uninitialized => Err(ClientNonceError::InvalidStateForOperation.into()),
    }
}

pub async fn process_authorize_nonce_account(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    nonce_account: &Pubkey,
    nonce_authority: SignerIndex,
    memo: Option<&String>,
    new_authority: &Pubkey,
) -> ProcessResult {
    let latest_blockhash = rpc_client.get_latest_blockhash().await?;

    let nonce_authority = config.signers[nonce_authority];
    let ixs = vec![authorize_nonce_account(
        nonce_account,
        &nonce_authority.pubkey(),
        new_authority,
    )]
    .with_memo(memo);
    let message = Message::new(&ixs, Some(&config.signers[0].pubkey()));
    let mut tx = Transaction::new_unsigned(message);
    tx.try_sign(&config.signers, latest_blockhash)?;

    check_account_for_fee_with_commitment(
        rpc_client,
        &config.signers[0].pubkey(),
        &tx.message,
        config.commitment_config,
    )
    .await?;
    // TODO:
    // let result = rpc_client.send_and_confirm_transaction_with_spinner(&tx);
    let result = rpc_client.send_and_confirm_transaction(&tx).await;

    log_instruction_custom_error::<SystemError>(result, config)
}

pub async fn process_create_nonce_account(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    nonce_account: SignerIndex,
    seed: Option<String>,
    nonce_authority: Option<Pubkey>,
    memo: Option<&String>,
    amount: SpendAmount,
) -> ProcessResult {
    let nonce_account_pubkey = config.signers[nonce_account].pubkey();
    let nonce_account_address = if let Some(ref seed) = seed {
        Pubkey::create_with_seed(&nonce_account_pubkey, seed, &system_program::id())?
    } else {
        nonce_account_pubkey
    };

    check_unique_pubkeys(
        (&config.signers[0].pubkey(), "cli keypair".to_string()),
        (&nonce_account_address, "nonce_account".to_string()),
    )?;

    let nonce_authority = nonce_authority.unwrap_or_else(|| config.signers[0].pubkey());

    let build_message = |lamports| {
        let ixs = if let Some(seed) = seed.clone() {
            create_nonce_account_with_seed(
                &config.signers[0].pubkey(), // from
                &nonce_account_address,      // to
                &nonce_account_pubkey,       // base
                &seed,                       // seed
                &nonce_authority,
                lamports,
            )
            .with_memo(memo)
        } else {
            create_nonce_account(
                &config.signers[0].pubkey(),
                &nonce_account_pubkey,
                &nonce_authority,
                lamports,
            )
            .with_memo(memo)
        };
        Message::new(&ixs, Some(&config.signers[0].pubkey()))
    };

    let latest_blockhash = rpc_client.get_latest_blockhash().await?;

    let (message, lamports) = resolve_spend_tx_and_check_account_balance(
        rpc_client,
        false,
        amount,
        &latest_blockhash,
        &config.signers[0].pubkey(),
        build_message,
        config.commitment_config,
    )
    .await?;

    if let Ok(nonce_account) = nonce_utils::get_account(rpc_client, &nonce_account_address).await {
        let err_msg = if state_from_account(&nonce_account).is_ok() {
            format!("Nonce account {} already exists", nonce_account_address)
        } else {
            format!(
                "Account {} already exists and is not a nonce account",
                nonce_account_address
            )
        };
        return Err(CliError::BadParameter(err_msg).into());
    }

    let minimum_balance = rpc_client
        .get_minimum_balance_for_rent_exemption(State::size())
        .await?;
    if lamports < minimum_balance {
        return Err(CliError::BadParameter(format!(
            "need at least {} lamports for nonce account to be rent exempt, provided lamports: {}",
            minimum_balance, lamports
        ))
        .into());
    }

    let mut tx = Transaction::new_unsigned(message);
    tx.try_sign(&config.signers, latest_blockhash)?;
    let _merge_errors =
        get_feature_is_active(rpc_client, &merge_nonce_error_into_system_error::id()).await?;

    // TODO:
    // let result = rpc_client.send_and_confirm_transaction_with_spinner(&tx);
    let result = rpc_client.send_and_confirm_transaction(&tx).await?;
    PgTerminal::log_wasm(&format!(
        "Created nonce account {} with {} SOL",
        nonce_account_pubkey,
        lamports_to_sol(lamports),
    ));

    Ok(result.to_string())

    // let err_ix_index = if let Err(err) = &result {
    //     err.get_transaction_error().and_then(|tx_err| {
    //         if let TransactionError::InstructionError(ix_index, _) = tx_err {
    //             Some(ix_index)
    //         } else {
    //             None
    //         }
    //     })
    // } else {
    //     None
    // };

    // match err_ix_index {
    //     // SystemInstruction::InitializeNonceAccount failed
    //     Some(1) => {
    //         if merge_errors {
    //             log_instruction_custom_error::<SystemError>(result, config)
    //         } else {
    //             log_instruction_custom_error_ex::<NonceError, _>(result, config, |ix_error| {
    //                 if let InstructionError::Custom(_) = ix_error {
    //                     instruction_to_nonce_error(ix_error, merge_errors)
    //                 } else {
    //                     None
    //                 }
    //             })
    //         }
    //     }
    //     // SystemInstruction::CreateAccount{,WithSeed} failed
    //     _ => log_instruction_custom_error::<SystemError>(result, config),
    // }
}

pub async fn process_get_nonce(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    nonce_account_pubkey: &Pubkey,
) -> ProcessResult {
    #[allow(clippy::redundant_closure)]
    match nonce_utils::get_account_with_commitment(
        rpc_client,
        nonce_account_pubkey,
        config.commitment_config,
    )
    .await
    .and_then(|ref a| state_from_account(a))?
    {
        State::Uninitialized => Ok("Nonce account is uninitialized".to_string()),
        State::Initialized(ref data) => Ok(format!("{:?}", data.blockhash())),
    }
}

pub async fn process_new_nonce(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    nonce_account: &Pubkey,
    nonce_authority: SignerIndex,
    memo: Option<&String>,
) -> ProcessResult {
    check_unique_pubkeys(
        (&config.signers[0].pubkey(), "cli keypair".to_string()),
        (nonce_account, "nonce_account_pubkey".to_string()),
    )?;

    if let Err(err) = rpc_client.get_account(nonce_account).await {
        return Err(CliError::BadParameter(format!(
            "Unable to advance nonce account {}. error: {}",
            nonce_account, err
        ))
        .into());
    }

    let nonce_authority = config.signers[nonce_authority];
    let ixs = vec![advance_nonce_account(
        nonce_account,
        &nonce_authority.pubkey(),
    )]
    .with_memo(memo);
    let latest_blockhash = rpc_client.get_latest_blockhash().await?;
    let message = Message::new(&ixs, Some(&config.signers[0].pubkey()));
    let mut tx = Transaction::new_unsigned(message);
    tx.try_sign(&config.signers, latest_blockhash)?;
    check_account_for_fee_with_commitment(
        rpc_client,
        &config.signers[0].pubkey(),
        &tx.message,
        config.commitment_config,
    )
    .await?;
    // TODO:
    // let result = rpc_client.send_and_confirm_transaction_with_spinner(&tx);
    let result = rpc_client.send_and_confirm_transaction(&tx).await;

    log_instruction_custom_error::<SystemError>(result, config)
}

pub async fn process_show_nonce_account(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    nonce_account_pubkey: &Pubkey,
    use_lamports_unit: bool,
) -> ProcessResult {
    let nonce_account = nonce_utils::get_account_with_commitment(
        rpc_client,
        nonce_account_pubkey,
        config.commitment_config,
    )
    .await?;
    let minimum_balance_for_rent_exemption = rpc_client
        .get_minimum_balance_for_rent_exemption(State::size())
        .await?;
    let print_account = |data: Option<&nonce::state::Data>| {
        let mut nonce_account = CliNonceAccount {
            balance: nonce_account.lamports,
            minimum_balance_for_rent_exemption,
            use_lamports_unit,
            ..CliNonceAccount::default()
        };
        if let Some(data) = data {
            nonce_account.nonce = Some(data.blockhash().to_string());
            nonce_account.lamports_per_signature = Some(data.fee_calculator.lamports_per_signature);
            nonce_account.authority = Some(data.authority.to_string());
        }

        Ok(config.output_format.formatted_string(&nonce_account))
    };
    match state_from_account(&nonce_account)? {
        State::Uninitialized => print_account(None),
        State::Initialized(ref data) => print_account(Some(data)),
    }
}

pub async fn process_withdraw_from_nonce_account(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    nonce_account: &Pubkey,
    nonce_authority: SignerIndex,
    memo: Option<&String>,
    destination_account_pubkey: &Pubkey,
    lamports: u64,
) -> ProcessResult {
    let latest_blockhash = rpc_client.get_latest_blockhash().await?;

    let nonce_authority = config.signers[nonce_authority];
    let ixs = vec![withdraw_nonce_account(
        nonce_account,
        &nonce_authority.pubkey(),
        destination_account_pubkey,
        lamports,
    )]
    .with_memo(memo);
    let message = Message::new(&ixs, Some(&config.signers[0].pubkey()));
    let mut tx = Transaction::new_unsigned(message);
    tx.try_sign(&config.signers, latest_blockhash)?;
    check_account_for_fee_with_commitment(
        rpc_client,
        &config.signers[0].pubkey(),
        &tx.message,
        config.commitment_config,
    )
    .await?;
    // TODO:
    // let result = rpc_client.send_and_confirm_transaction_with_spinner(&tx);
    let result = rpc_client.send_and_confirm_transaction(&tx).await;

    log_instruction_custom_error::<SystemError>(result, config)
}
