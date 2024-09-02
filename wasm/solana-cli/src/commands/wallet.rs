use std::rc::Rc;

use clap::{Arg, ArgMatches, Command};
use solana_clap_v3_utils_wasm::{
    fee_payer::{fee_payer_arg, FEE_PAYER_ARG},
    input_parsers::{lamports_of_sol, pubkey_of, pubkey_of_signer, signer_of},
    input_validators::{is_amount_or_all, is_derived_address_seed},
    keypair::{generate_unique_signers, SignerIndex},
    memo::{memo_arg, MEMO_ARG},
    nonce::{NonceArgs, NONCE_ARG, NONCE_AUTHORITY_ARG},
    offline::{OfflineArgs, DUMP_TRANSACTION_MESSAGE, SIGN_ONLY_ARG},
};
use solana_cli_output_wasm::cli_output::{
    build_balance_message, return_signers_with_config, CliAccount, CliSignatureVerificationStatus,
    CliTransaction, CliTransactionConfirmation, ReturnSignersConfig, RpcKeyedAccount,
};
use solana_client_wasm::{
    utils::{
        nonce_utils,
        rpc_config::{BlockhashQuery, RpcTransactionConfig},
    },
    WasmClient,
};
use solana_extra_wasm::{
    account_decoder::{UiAccount, UiAccountEncoding},
    transaction_status::{
        EncodableWithMeta, EncodedConfirmedTransactionWithStatusMeta, EncodedTransaction,
        TransactionBinaryEncoding, UiTransactionEncoding,
    },
};
use solana_playground_utils_wasm::js::PgTerminal;
use solana_remote_wallet::remote_wallet::RemoteWalletManager;
use solana_sdk::{
    message::Message,
    pubkey::Pubkey,
    signature::Signature,
    signer::Signer,
    stake,
    system_instruction::{self, SystemError},
    system_program,
    transaction::{Transaction, VersionedTransaction},
    vote,
};

use crate::{
    cli::{
        log_instruction_custom_error, CliCommand, CliCommandInfo, CliConfig, CliError,
        ProcessResult, SignatureResult,
    },
    utils::{
        blockhash_query::blockhash_query_from_matches,
        memo::WithMemo,
        spend_utils::{resolve_spend_tx_and_check_account_balances, SpendAmount},
    },
};

use super::nonce::check_nonce_account;

pub trait WalletSubCommands {
    fn wallet_subcommands(self) -> Self;
}

impl WalletSubCommands for Command<'_> {
    fn wallet_subcommands(self) -> Self {
        self.subcommand(
                    Command::new("account")
                        .about("Show the contents of an account")
                        .alias("account")
                        .arg(
                            pubkey!(Arg::new("account_pubkey")
                                .index(1)
                                .value_name("ACCOUNT_ADDRESS")
                                .required(true),
                                "Account key URI. ")
                        )
                        .arg(
                            Arg::new("output_file")
                                .long("output-file")
                                .short('o')
                                .value_name("FILEPATH")
                                .takes_value(true)
                                .help("Write the account data to this file"),
                        )
                        .arg(
                            Arg::new("lamports")
                                .long("lamports")
                                .takes_value(false)
                                .help("Display balance in lamports instead of SOL"),
                        ),
                )
                .subcommand(
                    Command::new("address")
                        .about("Get your public key")
                        .arg(
                            Arg::new("confirm_key")
                                .long("confirm-key")
                                .takes_value(false)
                                .help("Confirm key on device; only relevant if using remote wallet"),
                        ),
                )
        .subcommand(
            Command::new("airdrop")
                .about("Request SOL from a faucet")
                .arg(
                    Arg::new("amount")
                        .index(1)
                        .value_name("AMOUNT")
                        .takes_value(true)
                        //TODO: .validator(is_amount)
                        .required(true)
                        .help("The airdrop amount to request, in SOL"),
                )
                .arg(pubkey!(
                    Arg::new("to").index(2).value_name("RECIPIENT_ADDRESS"),
                    "The account address of airdrop recipient. "
                )),
        )
        .subcommand(
            Command::new("balance")
                .about("Get your balance")
                .arg(pubkey!(
                    Arg::new("pubkey").index(1).value_name("ACCOUNT_ADDRESS"),
                    "The account address of the balance to check. "
                ))
                .arg(
                    Arg::new("lamports")
                        .long("lamports")
                        .takes_value(false)
                        .help("Display balance in lamports instead of SOL"),
                ),
        )
                .subcommand(
                    Command::new("confirm")
                        .about("Confirm transaction by signature")
                        .arg(
                            Arg::new("signature")
                                .index(1)
                                .value_name("TRANSACTION_SIGNATURE")
                                .takes_value(true)
                                .required(true)
                                .help("The transaction signature to confirm"),
                        )
                        .after_help(// Formatted specifically for the manually-indented heredoc string
                           "Note: This will show more detailed information for finalized transactions with verbose mode (-v/--verbose).\
                          \n\
                          \nAccount modes:\
                          \n  |srwx|\
                          \n    s: signed\
                          \n    r: readable (always true)\
                          \n    w: writable\
                          \n    x: program account (inner instructions excluded)\
                           "
                        ),
                )
                .subcommand(
                    Command::new("create-address-with-seed")
                        .about("Generate a derived account address with a seed")
                        .arg(
                            Arg::new("seed")
                                .index(1)
                                .value_name("SEED_STRING")
                                .takes_value(true)
                                .required(true)
                               .validator(is_derived_address_seed)
                                .help("The seed.  Must not take more than 32 bytes to encode as utf-8"),
                        )
                        .arg(
                            Arg::new("program_id")
                                .index(2)
                                .value_name("PROGRAM_ID")
                                .takes_value(true)
                                .required(true)
                                .help(
                                    "The program_id that the address will ultimately be used for, \n\
                                     or one of NONCE, STAKE, and VOTE keywords",
                                ),
                        )
                        .arg(
                            pubkey!(Arg::new("from")
                                .long("from")
                                .value_name("FROM_PUBKEY")
                                .required(false),
                                "From (base) key, [default: cli config keypair]. "),
                        ),
                )
                .subcommand(
                    Command::new("decode-transaction")
                        .about("Decode a serialized transaction")
                        .arg(
                            Arg::new("transaction")
                                .index(1)
                                .value_name("TRANSACTION")
                                .takes_value(true)
                                .required(true)
                                .help("transaction to decode"),
                        )
                        .arg(
                            Arg::new("encoding")
                                .index(2)
                                .value_name("ENCODING")
                                .possible_values(["base58", "base64"]) // Variants of `TransactionBinaryEncoding` enum
                                .default_value("base58")
                                .takes_value(true)
                                .required(true)
                                .help("transaction encoding"),
                        ),
                )
                // TODO:
                // .subcommand(
                //     Command::new("resolve-signer")
                //         .about("Checks that a signer is valid, and returns its specific path; useful for signers that may be specified generally, eg. usb://ledger")
                //         .arg(
                //             Arg::new("signer")
                //                 .index(1)
                //                 .value_name("SIGNER_KEYPAIR")
                //                 .takes_value(true)
                //                 .required(true)
                //                .validator(is_valid_signer)
                //                 .help("The signer path to resolve")
                //         )
                // )
                .subcommand(
                    Command::new("transfer")
                        .about("Transfer funds between system accounts")
                        .alias("pay")
                        .arg(
                            pubkey!(Arg::new("to")
                                .index(1)
                                .value_name("RECIPIENT_ADDRESS")
                                .required(true),
                                "The account address of recipient. "),
                        )
                        .arg(
                            Arg::new("amount")
                                .index(2)
                                .value_name("AMOUNT")
                                .takes_value(true)
                               .validator(is_amount_or_all)
                                .required(true)
                                .help("The amount to send, in SOL; accepts keyword ALL"),
                        )
                        .arg(
                            pubkey!(Arg::new("from")
                                .long("from")
                                .value_name("FROM_ADDRESS"),
                                "Source account of funds (if different from client local account). "),
                        )
                        .arg(
                            Arg::new("no_wait")
                                .long("no-wait")
                                .takes_value(false)
                                .help("Return signature immediately after submitting the transaction, instead of waiting for confirmations"),
                        )
                        .arg(
                            Arg::new("derived_address_seed")
                                .long("derived-address-seed")
                                .takes_value(true)
                                .value_name("SEED_STRING")
                                .requires("derived_address_program_id")
                               .validator(is_derived_address_seed)
                                .hide(true)
                        )
                        .arg(
                            Arg::new("derived_address_program_id")
                            .long("derived-address-program-id")
                            .takes_value(true)
                            .value_name("PROGRAM_ID")
                            .requires("derived_address_seed")
                            .hide(true)
                        )
                        .arg(
                            Arg::new("allow_unfunded_recipient")
                                .long("allow-unfunded-recipient")
                                .takes_value(false)
                                .help("Complete the transfer even if the recipient address is not funded")
                        )
                        .offline_args()
                        .nonce_args(false)
                        .arg(memo_arg())
                        .arg(fee_payer_arg()),
                )
    }
}

fn resolve_derived_address_program_id(matches: &ArgMatches, arg_name: &str) -> Option<Pubkey> {
    matches.value_of(arg_name).and_then(|v| {
        let upper = v.to_ascii_uppercase();
        match upper.as_str() {
            "NONCE" | "SYSTEM" => Some(system_program::id()),
            "STAKE" => Some(stake::program::id()),
            "VOTE" => Some(vote::program::id()),
            _ => pubkey_of(matches, arg_name),
        }
    })
}

pub fn parse_account(
    matches: &ArgMatches,
    wallet_manager: &mut Option<Rc<RemoteWalletManager>>,
) -> Result<CliCommandInfo, CliError> {
    let account_pubkey = pubkey_of_signer(matches, "account_pubkey", wallet_manager)?.unwrap();
    let output_file = matches.value_of("output_file");
    let use_lamports_unit = matches.is_present("lamports");
    Ok(CliCommandInfo {
        command: CliCommand::ShowAccount {
            pubkey: account_pubkey,
            output_file: output_file.map(ToString::to_string),
            use_lamports_unit,
        },
        signers: vec![],
    })
}

pub fn parse_airdrop(
    matches: &ArgMatches,
    default_signer: Box<dyn Signer>,
    wallet_manager: &mut Option<Rc<RemoteWalletManager>>,
) -> Result<CliCommandInfo, CliError> {
    let pubkey = pubkey_of_signer(matches, "to", wallet_manager)?;
    let signers = if pubkey.is_some() {
        vec![]
    } else {
        vec![default_signer]
    };
    let lamports = lamports_of_sol(matches, "amount").unwrap();
    Ok(CliCommandInfo {
        command: CliCommand::Airdrop { pubkey, lamports },
        signers,
    })
}

pub fn parse_balance(
    matches: &ArgMatches,
    default_signer: Box<dyn Signer>,
    wallet_manager: &mut Option<Rc<RemoteWalletManager>>,
) -> Result<CliCommandInfo, CliError> {
    let pubkey = pubkey_of_signer(matches, "pubkey", wallet_manager)?;
    let signers = if pubkey.is_some() {
        vec![]
    } else {
        // TODO:
        vec![default_signer]
    };
    Ok(CliCommandInfo {
        command: CliCommand::Balance {
            pubkey,
            use_lamports_unit: matches.is_present("lamports"),
        },
        signers,
    })
}

pub fn parse_confirm(matches: &ArgMatches) -> Result<CliCommandInfo, CliError> {
    match matches.value_of("signature").unwrap().parse() {
        Ok(signature) => Ok(CliCommandInfo {
            command: CliCommand::Confirm(signature),
            signers: vec![],
        }),
        _ => Err(CliError::BadParameter("Invalid signature".to_string())),
    }
}

pub fn parse_decode_transaction(matches: &ArgMatches) -> Result<CliCommandInfo, CliError> {
    let blob = matches.value_of_t_or_exit("transaction");
    let binary_encoding = match matches.value_of("encoding").unwrap() {
        "base58" => TransactionBinaryEncoding::Base58,
        "base64" => TransactionBinaryEncoding::Base64,
        _ => unreachable!(),
    };

    let encoded_transaction = EncodedTransaction::Binary(blob, binary_encoding);
    if let Some(transaction) = encoded_transaction.decode() {
        Ok(CliCommandInfo {
            command: CliCommand::DecodeTransaction(transaction),
            signers: vec![],
        })
    } else {
        Err(CliError::BadParameter(
            "Unable to decode transaction".to_string(),
        ))
    }
}

pub fn parse_create_address_with_seed(
    matches: &ArgMatches,
    default_signer: Box<dyn Signer>,
    wallet_manager: &mut Option<Rc<RemoteWalletManager>>,
) -> Result<CliCommandInfo, CliError> {
    let from_pubkey = pubkey_of_signer(matches, "from", wallet_manager)?;
    let signers = if from_pubkey.is_some() {
        vec![]
    } else {
        vec![default_signer]
    };

    let program_id = resolve_derived_address_program_id(matches, "program_id").unwrap();

    let seed = matches.value_of("seed").unwrap().to_string();

    Ok(CliCommandInfo {
        command: CliCommand::CreateAddressWithSeed {
            from_pubkey,
            seed,
            program_id,
        },
        signers,
    })
}

pub fn parse_transfer(
    matches: &ArgMatches,
    default_signer: Box<dyn Signer>,
    wallet_manager: &mut Option<Rc<RemoteWalletManager>>,
) -> Result<CliCommandInfo, CliError> {
    let amount = SpendAmount::new_from_matches(matches, "amount");
    let to = pubkey_of_signer(matches, "to", wallet_manager)?.unwrap();
    let sign_only = matches.is_present(SIGN_ONLY_ARG.name);
    let dump_transaction_message = matches.is_present(DUMP_TRANSACTION_MESSAGE.name);
    let no_wait = matches.is_present("no_wait");
    let blockhash_query = blockhash_query_from_matches(matches);
    let nonce_account = pubkey_of_signer(matches, NONCE_ARG.name, wallet_manager)?;
    let (nonce_authority, nonce_authority_pubkey) =
        signer_of(matches, NONCE_AUTHORITY_ARG.name, wallet_manager)?;
    let memo = matches.value_of(MEMO_ARG.name).map(String::from);
    let (fee_payer, fee_payer_pubkey) = signer_of(matches, FEE_PAYER_ARG.name, wallet_manager)?;
    let (from, from_pubkey) = signer_of(matches, "from", wallet_manager)?;
    let allow_unfunded_recipient = matches.is_present("allow_unfunded_recipient");

    let mut bulk_signers = vec![fee_payer, from];
    if nonce_account.is_some() {
        bulk_signers.push(nonce_authority);
    }

    let signer_info = generate_unique_signers(default_signer, bulk_signers)?;

    let derived_address_seed = matches
        .value_of("derived_address_seed")
        .map(|s| s.to_string());
    let derived_address_program_id =
        resolve_derived_address_program_id(matches, "derived_address_program_id");

    Ok(CliCommandInfo {
        command: CliCommand::Transfer {
            amount,
            to,
            sign_only,
            dump_transaction_message,
            allow_unfunded_recipient,
            no_wait,
            blockhash_query,
            nonce_account,
            nonce_authority: signer_info.index_of(nonce_authority_pubkey).unwrap(),
            memo,
            fee_payer: signer_info.index_of(fee_payer_pubkey).unwrap(),
            from: signer_info.index_of(from_pubkey).unwrap(),
            derived_address_seed,
            derived_address_program_id,
        },
        signers: signer_info.signers,
    })
}

pub async fn process_show_account(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    account_pubkey: &Pubkey,
    _output_file: &Option<String>,
    use_lamports_unit: bool,
) -> ProcessResult {
    let account = rpc_client.get_account(account_pubkey).await?;
    // TODO:
    // let data = account.data.clone();
    let cli_account = CliAccount {
        keyed_account: RpcKeyedAccount {
            pubkey: account_pubkey.to_string(),
            account: UiAccount::encode(
                account_pubkey,
                &account,
                UiAccountEncoding::Base64,
                None,
                None,
            ),
        },
        use_lamports_unit,
    };

    let account_string = config.output_format.formatted_string(&cli_account);

    // TODO:
    // match config.output_format {
    //     OutputFormat::Json | OutputFormat::JsonCompact => {
    //         if let Some(output_file) = output_file {
    //             let mut f = File::create(output_file)?;
    //             f.write_all(account_string.as_bytes())?;
    //             writeln!(&mut account_string)?;
    //             writeln!(&mut account_string, "Wrote account to {}", output_file)?;
    //         }
    //     }
    //     OutputFormat::Display | OutputFormat::DisplayVerbose => {
    //         if let Some(output_file) = output_file {
    //             let mut f = File::create(output_file)?;
    //             f.write_all(&data)?;
    //             writeln!(&mut account_string)?;
    //             writeln!(&mut account_string, "Wrote account data to {}", output_file)?;
    //         } else if !data.is_empty() {
    //             use pretty_hex::*;
    //             writeln!(&mut account_string, "{:?}", data.hex_dump())?;
    //         }
    //     }
    //     OutputFormat::DisplayQuiet => (),
    // }

    Ok(account_string)
}

pub async fn process_airdrop(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    pubkey: &Option<Pubkey>,
    lamports: u64,
) -> ProcessResult {
    let pubkey = if let Some(pubkey) = pubkey {
        *pubkey
    } else {
        config.pubkey()?
    };
    PgTerminal::log_wasm(&format!(
        "Requesting airdrop of {}",
        build_balance_message(lamports, false, true),
    ));

    let pre_balance = rpc_client
        .get_balance_with_commitment(&pubkey, config.commitment_config)
        .await?;

    let result = request_and_confirm_airdrop(rpc_client, config, &pubkey, lamports).await;
    if let Ok(signature) = result {
        let signature_cli_message = log_instruction_custom_error::<SystemError>(result, config)?;
        PgTerminal::log_wasm(&signature_cli_message.to_string());

        let current_balance = rpc_client
            .get_balance_with_commitment(&pubkey, config.commitment_config)
            .await?;

        if current_balance < pre_balance.saturating_add(lamports) {
            PgTerminal::log_wasm(&format!(
                "Balance unchanged\nRun `solana confirm -v {:?}` for more info",
                signature
            ));
            Ok("".to_string())
        } else {
            Ok(build_balance_message(current_balance, false, true))
        }
    } else {
        log_instruction_custom_error::<SystemError>(result, config)
    }
}

pub async fn process_balance(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    pubkey: &Option<Pubkey>,
    use_lamports_unit: bool,
) -> ProcessResult {
    let pubkey = if let Some(pubkey) = pubkey {
        *pubkey
    } else {
        config.pubkey()?
    };
    let balance = rpc_client
        .get_balance_with_commitment(&pubkey, config.commitment_config)
        .await?;
    Ok(build_balance_message(balance, use_lamports_unit, true))
}

pub async fn process_confirm(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    signature: &Signature,
) -> ProcessResult {
    match rpc_client.get_signature_statuses(&[*signature]).await {
        Ok(status) => {
            let cli_transaction = if let Some(transaction_status) = &status[0] {
                let mut transaction = None;
                let mut get_transaction_error = None;
                if config.verbose {
                    match rpc_client
                        .get_transaction_with_config(
                            signature,
                            RpcTransactionConfig {
                                encoding: Some(UiTransactionEncoding::Base64),
                                commitment: Some(config.commitment_config),
                                max_supported_transaction_version: Some(0),
                            },
                        )
                        .await
                    {
                        Ok(confirmed_transaction) => {
                            let EncodedConfirmedTransactionWithStatusMeta {
                                block_time,
                                slot,
                                transaction: transaction_with_meta,
                            } = confirmed_transaction;

                            let decoded_transaction =
                                transaction_with_meta.transaction.decode().unwrap();
                            let json_transaction = decoded_transaction.json_encode();

                            transaction = Some(CliTransaction {
                                transaction: json_transaction,
                                meta: transaction_with_meta.meta,
                                block_time,
                                slot: Some(slot),
                                decoded_transaction,
                                prefix: "  ".to_string(),
                                sigverify_status: vec![],
                            });
                        }
                        Err(err) => {
                            get_transaction_error = Some(format!("{:?}", err));
                        }
                    }
                }
                CliTransactionConfirmation {
                    confirmation_status: transaction_status.confirmation_status.clone(),
                    transaction,
                    get_transaction_error,
                    err: transaction_status.err.clone(),
                }
            } else {
                CliTransactionConfirmation {
                    confirmation_status: None,
                    transaction: None,
                    get_transaction_error: None,
                    err: None,
                }
            };
            Ok(config.output_format.formatted_string(&cli_transaction))
        }
        Err(err) => Err(CliError::RpcRequestError(format!("Unable to confirm: {}", err)).into()),
    }
}

pub fn process_create_address_with_seed(
    config: &CliConfig<'_>,
    from_pubkey: Option<&Pubkey>,
    seed: &str,
    program_id: &Pubkey,
) -> ProcessResult {
    let from_pubkey = if let Some(pubkey) = from_pubkey {
        *pubkey
    } else {
        config.pubkey()?
    };
    let address = Pubkey::create_with_seed(&from_pubkey, seed, program_id)?;
    Ok(address.to_string())
}

#[allow(clippy::unnecessary_wraps)]
pub fn process_decode_transaction(
    config: &CliConfig<'_>,
    transaction: &VersionedTransaction,
) -> ProcessResult {
    let sigverify_status = CliSignatureVerificationStatus::verify_transaction(transaction);
    let decode_transaction = CliTransaction {
        decoded_transaction: transaction.clone(),
        transaction: transaction.json_encode(),
        meta: None,
        block_time: None,
        slot: None,
        prefix: "".to_string(),
        sigverify_status,
    };
    Ok(config.output_format.formatted_string(&decode_transaction))
}

#[allow(clippy::too_many_arguments)]
pub async fn process_transfer(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    amount: SpendAmount,
    to: &Pubkey,
    from: SignerIndex,
    sign_only: bool,
    dump_transaction_message: bool,
    allow_unfunded_recipient: bool,
    no_wait: bool,
    blockhash_query: &BlockhashQuery,
    nonce_account: Option<&Pubkey>,
    nonce_authority: SignerIndex,
    memo: Option<&String>,
    fee_payer: SignerIndex,
    derived_address_seed: Option<String>,
    derived_address_program_id: Option<&Pubkey>,
) -> ProcessResult {
    let from = config.signers[from];
    let mut from_pubkey = from.pubkey();

    let recent_blockhash = blockhash_query
        .get_blockhash(rpc_client, config.commitment_config)
        .await?;

    if !sign_only && !allow_unfunded_recipient {
        let recipient_balance = rpc_client
            .get_balance_with_commitment(to, config.commitment_config)
            .await?;
        if recipient_balance == 0 {
            return Err(format!(
                "The recipient address ({}) is not funded. \
                                Add `--allow-unfunded-recipient` to complete the transfer \
                               ",
                to
            )
            .into());
        }
    }

    let nonce_authority = config.signers[nonce_authority];
    let fee_payer = config.signers[fee_payer];

    let derived_parts = derived_address_seed.zip(derived_address_program_id);
    let with_seed = if let Some((seed, program_id)) = derived_parts {
        let base_pubkey = from_pubkey;
        from_pubkey = Pubkey::create_with_seed(&base_pubkey, &seed, program_id)?;
        Some((base_pubkey, seed, program_id, from_pubkey))
    } else {
        None
    };

    let build_message = |lamports| {
        let ixs = if let Some((base_pubkey, seed, program_id, from_pubkey)) = with_seed.as_ref() {
            vec![system_instruction::transfer_with_seed(
                from_pubkey,
                base_pubkey,
                seed.clone(),
                program_id,
                to,
                lamports,
            )]
            .with_memo(memo)
        } else {
            vec![system_instruction::transfer(&from_pubkey, to, lamports)].with_memo(memo)
        };

        if let Some(nonce_account) = &nonce_account {
            Message::new_with_nonce(
                ixs,
                Some(&fee_payer.pubkey()),
                nonce_account,
                &nonce_authority.pubkey(),
            )
        } else {
            Message::new(&ixs, Some(&fee_payer.pubkey()))
        }
    };

    let (message, _) = resolve_spend_tx_and_check_account_balances(
        rpc_client,
        sign_only,
        amount,
        &recent_blockhash,
        &from_pubkey,
        &fee_payer.pubkey(),
        build_message,
        config.commitment_config,
    )
    .await?;
    let mut tx = Transaction::new_unsigned(message);

    if sign_only {
        tx.try_partial_sign(&config.signers, recent_blockhash)?;
        return_signers_with_config(
            &tx,
            &config.output_format,
            &ReturnSignersConfig {
                dump_transaction_message,
            },
        )
    } else {
        if let Some(nonce_account) = &nonce_account {
            let nonce_account = nonce_utils::get_account_with_commitment(
                rpc_client,
                nonce_account,
                config.commitment_config,
            )
            .await?;
            check_nonce_account(&nonce_account, &nonce_authority.pubkey(), &recent_blockhash)?;
        }

        tx.try_sign(&config.signers, recent_blockhash)?;

        let result = send_tx_wrapper(rpc_client, &tx, no_wait).await;

        log_instruction_custom_error::<SystemError>(result, config)
    }
}

async fn request_and_confirm_airdrop(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    to_pubkey: &Pubkey,
    lamports: u64,
) -> SignatureResult {
    let signature = rpc_client.request_airdrop(to_pubkey, lamports).await?;
    let tx_success = rpc_client
        .confirm_transaction_with_commitment(&signature, config.commitment_config)
        .await?;
    if !tx_success {
        PgTerminal::log_wasm("Airdrop tx failed");
    }

    Ok(signature)
}

async fn send_tx_wrapper(
    rpc_client: &WasmClient,
    tx: &Transaction,
    no_wait: bool,
) -> SignatureResult {
    Ok(match no_wait {
        true => rpc_client.send_transaction(tx).await?,
        false => rpc_client.send_and_confirm_transaction(tx).await?,
    })
}
