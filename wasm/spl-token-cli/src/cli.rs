use std::{collections::HashMap, rc::Rc, str::FromStr, string::ToString};

use clap::ArgMatches;
use solana_clap_v3_utils_wasm::{
    input_parsers::{pubkey_of_signer, pubkeys_of_multiple_signers, value_of},
    keypair::CliSignerInfo,
};
use solana_cli_output_wasm::cli_output::{
    return_signers_data, CliSignOnlyData, CliSignature, OutputFormat, ReturnSignersConfig,
};
use solana_client_wasm::utils::rpc_filter::RpcTokenAccountsFilter;
use solana_extra_wasm::{
    account_decoder::{
        parse_token::{TokenAccountType, UiAccountState},
        UiAccountData,
    },
    program::{
        spl_associated_token_account::{
            get_associated_token_address_with_program_id,
            instruction::create_associated_token_account,
        },
        spl_memo,
        spl_token::{
            self,
            instruction::*,
            native_mint,
            state::{Account, Mint, Multisig},
        },
    },
};
use solana_playground_utils_wasm::js::PgTerminal;
use solana_remote_wallet::remote_wallet::RemoteWalletManager;
use solana_sdk::{
    instruction::Instruction,
    message::Message,
    native_token::*,
    program_option::COption,
    program_pack::Pack,
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    system_instruction, system_program,
    transaction::Transaction,
};
use strum_macros::{Display, EnumString, IntoStaticStr};

use crate::{
    clap::{DELEGATE_ADDRESS_ARG, MINT_ADDRESS_ARG, MINT_DECIMALS_ARG},
    config::{get_signer, Config},
    output::{
        format_output, println_display, CliMint, CliMultisig, CliTokenAccount, CliTokenAccounts,
        CliTokenAmount, CliWalletAddress,
    },
    sort::sort_and_parse_token_accounts,
};

#[derive(Debug, Clone, Copy, PartialEq, EnumString, IntoStaticStr, Display)]
#[strum(serialize_all = "kebab-case")]
pub enum CommandName {
    CreateToken,
    Close,
    //     Bench,
    CreateAccount,
    CreateMultisig,
    Authorize,
    Transfer,
    Burn,
    Mint,
    Freeze,
    Thaw,
    Wrap,
    Unwrap,
    Approve,
    Revoke,
    Balance,
    Supply,
    Accounts,
    Address,
    AccountInfo,
    MultisigInfo,
    Gc,
    SyncNative,
}

pub(crate) type CliError = Box<dyn std::error::Error>;

pub(crate) type BulkSigners = Vec<Box<dyn Signer>>;
pub(crate) type CommandResult = Result<String, CliError>;

fn new_throwaway_signer() -> (Box<dyn Signer>, Pubkey) {
    let keypair = Keypair::new();
    let pubkey = keypair.pubkey();
    (Box::new(keypair) as Box<dyn Signer>, pubkey)
}

pub(crate) async fn check_fee_payer_balance(
    config: &Config<'_>,
    required_balance: u64,
) -> Result<(), CliError> {
    let balance = config.rpc_client.get_balance(&config.fee_payer).await?;
    if balance < required_balance {
        Err(format!(
            "Fee payer, {}, has insufficient balance: {} required, {} available",
            config.fee_payer,
            lamports_to_sol(required_balance),
            lamports_to_sol(balance)
        )
        .into())
    } else {
        Ok(())
    }
}

async fn check_wallet_balance(
    config: &Config<'_>,
    wallet: &Pubkey,
    required_balance: u64,
) -> Result<(), CliError> {
    let balance = config.rpc_client.get_balance(wallet).await?;
    if balance < required_balance {
        Err(format!(
            "Wallet {}, has insufficient balance: {} required, {} available",
            wallet,
            lamports_to_sol(required_balance),
            lamports_to_sol(balance)
        )
        .into())
    } else {
        Ok(())
    }
}

// type SignersOf = Vec<(Box<dyn Signer>, Pubkey)>;
// pub fn signers_of(
//     matches: &ArgMatches<'_>,
//     name: &str,
//     wallet_manager: &mut Option<Arc<RemoteWalletManager>>,
// ) -> Result<Option<SignersOf>, Box<dyn std::error::Error>> {
//     if let Some(values) = matches.values_of(name) {
//         let mut results = Vec::new();
//         for (i, value) in values.enumerate() {
//             let name = format!("{}-{}", name, i + 1);
//             let signer = signer_from_path(matches, value, &name, wallet_manager)?;
//             let signer_pubkey = signer.pubkey();
//             results.push((signer, signer_pubkey));
//         }
//         Ok(Some(results))
//     } else {
//         Ok(None)
//     }
// }

pub async fn process_command<'a>(
    sub_command: CommandName,
    sub_matches: &'a ArgMatches,
    config: Config<'a>,
    mut wallet_manager: Option<Rc<RemoteWalletManager>>,
    mut bulk_signers: BulkSigners,
) -> CommandResult {
    // NOTE: Client signs by default, could change in the future
    bulk_signers.push(config.get_default_signer());

    match (sub_command, sub_matches) {
        //     (CommandName::Bench, arg_matches) => bench_process_command(
        //         arg_matches,
        //         config,
        //         std::mem::take(&mut bulk_signers),
        //         &mut wallet_manager,
        //     ),
        (CommandName::CreateToken, arg_matches) => {
            let decimals = arg_matches.value_of_t_or_exit::<u8>("decimals");
            let mint_authority =
                config.pubkey_or_default(arg_matches, "mint_authority", &mut wallet_manager);
            let memo = arg_matches.value_of_t::<String>("memo").ok();

            let (token_signer, token) =
                get_signer(arg_matches, "token_keypair", &mut wallet_manager)
                    .unwrap_or_else(new_throwaway_signer);

            // Token needs to sign
            bulk_signers.push(token_signer);

            command_create_token(
                &config,
                decimals,
                token,
                mint_authority,
                arg_matches.is_present("enable_freeze"),
                memo,
                bulk_signers,
            )
            .await
        }
        (CommandName::CreateAccount, arg_matches) => {
            let token = pubkey_of_signer(arg_matches, "token", &mut wallet_manager)
                .unwrap()
                .unwrap();

            // No need to add a signer when creating an associated token account
            let account = get_signer(arg_matches, "account_keypair", &mut wallet_manager).map(
                |(signer, account)| {
                    bulk_signers.push(signer);
                    account
                },
            );

            let owner = config.pubkey_or_default(arg_matches, "owner", &mut wallet_manager);
            command_create_account(&config, token, owner, account, bulk_signers).await
        }
        (CommandName::CreateMultisig, arg_matches) => {
            let minimum_signers = value_of::<u8>(arg_matches, "minimum_signers").unwrap();
            let multisig_members =
                pubkeys_of_multiple_signers(arg_matches, "multisig_member", &mut wallet_manager)
                    .unwrap_or_else(|e| {
                        eprintln!("error: {}", e);
                        panic!();
                    })
                    .unwrap();
            if minimum_signers as usize > multisig_members.len() {
                eprintln!(
                    "error: MINIMUM_SIGNERS cannot be greater than the number \
                              of MULTISIG_MEMBERs passed"
                );
                panic!();
            }

            let (signer, account) = get_signer(arg_matches, "address_keypair", &mut wallet_manager)
                .unwrap_or_else(new_throwaway_signer);
            bulk_signers.push(signer);

            command_create_multisig(
                &config,
                account,
                minimum_signers,
                multisig_members,
                bulk_signers,
            )
            .await
        }
        (CommandName::Authorize, arg_matches) => {
            let address = pubkey_of_signer(arg_matches, "address", &mut wallet_manager)
                .unwrap()
                .unwrap();
            let authority_type = arg_matches.value_of("authority_type").unwrap();
            let authority_type = match authority_type {
                "mint" => AuthorityType::MintTokens,
                "freeze" => AuthorityType::FreezeAccount,
                "owner" => AuthorityType::AccountOwner,
                "close" => AuthorityType::CloseAccount,
                _ => unreachable!(),
            };

            let (authority_signer, authority) =
                config.signer_or_default(arg_matches, "authority", &mut wallet_manager);
            bulk_signers.push(authority_signer);

            let new_authority =
                pubkey_of_signer(arg_matches, "new_authority", &mut wallet_manager).unwrap();
            let force_authorize = arg_matches.is_present("force");
            command_authorize(
                &config,
                address,
                authority_type,
                authority,
                new_authority,
                force_authorize,
                bulk_signers,
            )
            .await
        }
        (CommandName::Transfer, arg_matches) => {
            let token = pubkey_of_signer(arg_matches, "token", &mut wallet_manager)
                .unwrap()
                .unwrap();
            let amount = match arg_matches.value_of("amount").unwrap() {
                "ALL" => None,
                amount => Some(amount.parse::<f64>().unwrap()),
            };
            let recipient = pubkey_of_signer(arg_matches, "recipient", &mut wallet_manager)
                .unwrap()
                .unwrap();
            let sender = pubkey_of_signer(arg_matches, "from", &mut wallet_manager).unwrap();

            let (owner_signer, owner) =
                config.signer_or_default(arg_matches, "owner", &mut wallet_manager);
            bulk_signers.push(owner_signer);

            let mint_decimals = value_of::<u8>(arg_matches, MINT_DECIMALS_ARG.name);
            let fund_recipient = arg_matches.is_present("fund_recipient");
            let allow_unfunded_recipient = arg_matches.is_present("allow_empty_recipient")
                || arg_matches.is_present("allow_unfunded_recipient");

            let recipient_is_ata_owner = arg_matches.is_present("recipient_is_ata_owner");
            let use_unchecked_instruction = arg_matches.is_present("use_unchecked_instruction");
            let memo = arg_matches.value_of_t::<String>("memo").ok();

            command_transfer(
                &config,
                token,
                amount,
                recipient,
                sender,
                owner,
                allow_unfunded_recipient,
                fund_recipient,
                mint_decimals,
                recipient_is_ata_owner,
                use_unchecked_instruction,
                memo,
                bulk_signers,
                arg_matches.is_present("no_wait"),
                arg_matches.is_present("allow_non_system_account_recipient"),
            )
            .await
        }
        (CommandName::Burn, arg_matches) => {
            let source = pubkey_of_signer(arg_matches, "source", &mut wallet_manager)
                .unwrap()
                .unwrap();

            let (owner_signer, owner) =
                config.signer_or_default(arg_matches, "owner", &mut wallet_manager);
            bulk_signers.push(owner_signer);

            let amount = arg_matches.value_of_t_or_exit::<f64>("amount");
            let mint_address =
                pubkey_of_signer(arg_matches, MINT_ADDRESS_ARG.name, &mut wallet_manager).unwrap();
            let mint_decimals = value_of::<u8>(arg_matches, MINT_DECIMALS_ARG.name);
            let use_unchecked_instruction = arg_matches.is_present("use_unchecked_instruction");
            let memo = arg_matches.value_of_t::<String>("memo").ok();
            command_burn(
                &config,
                source,
                owner,
                amount,
                mint_address,
                mint_decimals,
                use_unchecked_instruction,
                memo,
                bulk_signers,
            )
            .await
        }
        (CommandName::Mint, arg_matches) => {
            let (mint_authority_signer, mint_authority) =
                config.signer_or_default(arg_matches, "mint_authority", &mut wallet_manager);
            bulk_signers.push(mint_authority_signer);

            let token = pubkey_of_signer(arg_matches, "token", &mut wallet_manager)
                .unwrap()
                .unwrap();
            let amount = arg_matches.value_of_t_or_exit::<f64>("amount");
            let recipient = config.associated_token_address_or_override(
                arg_matches,
                "recipient",
                &mut wallet_manager,
            );
            let mint_decimals = value_of::<u8>(arg_matches, MINT_DECIMALS_ARG.name);
            let use_unchecked_instruction = arg_matches.is_present("use_unchecked_instruction");

            command_mint(
                &config,
                token,
                amount,
                recipient,
                mint_decimals,
                mint_authority,
                use_unchecked_instruction,
                bulk_signers,
            )
            .await
        }
        (CommandName::Freeze, arg_matches) => {
            let (freeze_authority_signer, freeze_authority) =
                config.signer_or_default(arg_matches, "freeze_authority", &mut wallet_manager);
            bulk_signers.push(freeze_authority_signer);

            let account = pubkey_of_signer(arg_matches, "account", &mut wallet_manager)
                .unwrap()
                .unwrap();
            let mint_address =
                pubkey_of_signer(arg_matches, MINT_ADDRESS_ARG.name, &mut wallet_manager).unwrap();

            command_freeze(
                &config,
                account,
                mint_address,
                freeze_authority,
                bulk_signers,
            )
            .await
        }
        (CommandName::Thaw, arg_matches) => {
            let (freeze_authority_signer, freeze_authority) =
                config.signer_or_default(arg_matches, "freeze_authority", &mut wallet_manager);
            bulk_signers.push(freeze_authority_signer);

            let account = pubkey_of_signer(arg_matches, "account", &mut wallet_manager)
                .unwrap()
                .unwrap();
            let mint_address =
                pubkey_of_signer(arg_matches, MINT_ADDRESS_ARG.name, &mut wallet_manager).unwrap();
            command_thaw(
                &config,
                account,
                mint_address,
                freeze_authority,
                bulk_signers,
            )
            .await
        }
        (CommandName::Wrap, arg_matches) => {
            let amount = arg_matches.value_of_t_or_exit::<f64>("amount");
            let account = if arg_matches.is_present("create_aux_account") {
                let (signer, account) = new_throwaway_signer();
                bulk_signers.push(signer);
                Some(account)
            } else {
                // No need to add a signer when creating an associated token account
                None
            };

            let (wallet_signer, wallet_address) =
                config.signer_or_default(arg_matches, "wallet_keypair", &mut wallet_manager);
            bulk_signers.push(wallet_signer);

            command_wrap(&config, amount, wallet_address, account, bulk_signers).await
        }
        (CommandName::Unwrap, arg_matches) => {
            let (wallet_signer, wallet_address) =
                config.signer_or_default(arg_matches, "wallet_keypair", &mut wallet_manager);
            bulk_signers.push(wallet_signer);

            let address = pubkey_of_signer(arg_matches, "address", &mut wallet_manager).unwrap();
            command_unwrap(&config, wallet_address, address, bulk_signers).await
        }
        (CommandName::Approve, arg_matches) => {
            let (owner_signer, owner_address) =
                config.signer_or_default(arg_matches, "owner", &mut wallet_manager);
            bulk_signers.push(owner_signer);

            let account = pubkey_of_signer(arg_matches, "account", &mut wallet_manager)
                .unwrap()
                .unwrap();
            let amount = arg_matches.value_of_t_or_exit::<f64>("amount");
            let delegate = pubkey_of_signer(arg_matches, "delegate", &mut wallet_manager)
                .unwrap()
                .unwrap();
            let mint_address =
                pubkey_of_signer(arg_matches, MINT_ADDRESS_ARG.name, &mut wallet_manager).unwrap();
            let mint_decimals = value_of::<u8>(arg_matches, MINT_DECIMALS_ARG.name);
            let use_unchecked_instruction = arg_matches.is_present("use_unchecked_instruction");
            command_approve(
                &config,
                account,
                owner_address,
                amount,
                delegate,
                mint_address,
                mint_decimals,
                use_unchecked_instruction,
                bulk_signers,
            )
            .await
        }
        (CommandName::Revoke, arg_matches) => {
            let (owner_signer, owner_address) =
                config.signer_or_default(arg_matches, "owner", &mut wallet_manager);
            bulk_signers.push(owner_signer);

            let account = pubkey_of_signer(arg_matches, "account", &mut wallet_manager)
                .unwrap()
                .unwrap();
            let delegate_address =
                pubkey_of_signer(arg_matches, DELEGATE_ADDRESS_ARG.name, &mut wallet_manager)
                    .unwrap();
            command_revoke(
                &config,
                account,
                owner_address,
                delegate_address,
                bulk_signers,
            )
            .await
        }
        (CommandName::Close, arg_matches) => {
            let (close_authority_signer, close_authority) =
                config.signer_or_default(arg_matches, "close_authority", &mut wallet_manager);
            bulk_signers.push(close_authority_signer);

            let address = config.associated_token_address_or_override(
                arg_matches,
                "address",
                &mut wallet_manager,
            );
            let recipient = config.pubkey_or_default(arg_matches, "recipient", &mut wallet_manager);
            command_close(&config, address, close_authority, recipient, bulk_signers).await
        }
        (CommandName::Balance, arg_matches) => {
            let address = config.associated_token_address_or_override(
                arg_matches,
                "address",
                &mut wallet_manager,
            );
            command_balance(&config, address).await
        }
        (CommandName::Supply, arg_matches) => {
            let address = pubkey_of_signer(arg_matches, "address", &mut wallet_manager)
                .unwrap()
                .unwrap();
            command_supply(&config, address).await
        }
        (CommandName::Accounts, arg_matches) => {
            let token = pubkey_of_signer(arg_matches, "token", &mut wallet_manager).unwrap();
            let owner = config.pubkey_or_default(arg_matches, "owner", &mut wallet_manager);
            command_accounts(&config, token, owner).await
        }
        (CommandName::Address, arg_matches) => {
            let token = pubkey_of_signer(arg_matches, "token", &mut wallet_manager).unwrap();
            let owner = config.pubkey_or_default(arg_matches, "owner", &mut wallet_manager);
            command_address(&config, token, owner).await
        }
        (CommandName::AccountInfo, arg_matches) => {
            let address = config.associated_token_address_or_override(
                arg_matches,
                "address",
                &mut wallet_manager,
            );
            command_account_info(&config, address).await
        }
        (CommandName::MultisigInfo, arg_matches) => {
            let address = pubkey_of_signer(arg_matches, "address", &mut wallet_manager)
                .unwrap()
                .unwrap();
            command_multisig(&config, address).await
        }
        (CommandName::Gc, arg_matches) => {
            match config.output_format {
                OutputFormat::Json | OutputFormat::JsonCompact => {
                    eprintln!(
                        "`spl-token gc` does not support the `--ouput` parameter at this time"
                    );
                    panic!();
                }
                _ => {}
            }

            let close_empty_associated_accounts =
                arg_matches.is_present("close_empty_associated_accounts");

            let (owner_signer, owner_address) =
                config.signer_or_default(arg_matches, "owner", &mut wallet_manager);
            bulk_signers.push(owner_signer);

            command_gc(
                &config,
                owner_address,
                close_empty_associated_accounts,
                bulk_signers,
            )
            .await
        }
        (CommandName::SyncNative, arg_matches) => {
            let address = config.associated_token_address_for_token_or_override(
                arg_matches,
                "address",
                &mut wallet_manager,
                Some(native_mint::id()),
            );

            command_sync_native(&config, address, bulk_signers).await
        }
    }
}

#[allow(clippy::too_many_arguments)]
async fn command_create_token(
    config: &Config<'_>,
    decimals: u8,
    token: Pubkey,
    authority: Pubkey,
    enable_freeze: bool,
    memo: Option<String>,
    bulk_signers: BulkSigners,
) -> CommandResult {
    println_display(config, format!("Creating token {}", token));

    let minimum_balance_for_rent_exemption = if !config.sign_only {
        config
            .rpc_client
            .get_minimum_balance_for_rent_exemption(Mint::LEN)
            .await?
    } else {
        0
    };
    let freeze_authority_pubkey = if enable_freeze { Some(authority) } else { None };

    let mut instructions = vec![
        system_instruction::create_account(
            &config.fee_payer,
            &token,
            minimum_balance_for_rent_exemption,
            Mint::LEN as u64,
            &config.program_id,
        ),
        initialize_mint(
            &config.program_id,
            &token,
            &authority,
            freeze_authority_pubkey.as_ref(),
            decimals,
        )?,
    ];
    if let Some(text) = memo {
        instructions.push(spl_memo::build_memo(text.as_bytes(), &[&config.fee_payer]));
    }

    let tx_return = handle_tx(
        &CliSignerInfo {
            signers: bulk_signers,
        },
        config,
        false,
        minimum_balance_for_rent_exemption,
        instructions,
    )
    .await?;

    Ok(match tx_return {
        TransactionReturnData::CliSignature(cli_signature) => format_output(
            CliMint {
                address: token.to_string(),
                decimals,
                transaction_data: cli_signature,
            },
            &CommandName::CreateToken,
            config,
        ),
        TransactionReturnData::CliSignOnlyData(cli_sign_only_data) => {
            format_output(cli_sign_only_data, &CommandName::CreateToken, config)
        }
    })
}

async fn command_create_account(
    config: &Config<'_>,
    token: Pubkey,
    owner: Pubkey,
    maybe_account: Option<Pubkey>,
    bulk_signers: BulkSigners,
) -> CommandResult {
    let minimum_balance_for_rent_exemption = if !config.sign_only {
        config
            .rpc_client
            .get_minimum_balance_for_rent_exemption(Account::LEN)
            .await?
    } else {
        0
    };

    let (account, system_account_ok, instructions) = if let Some(account) = maybe_account {
        println_display(config, format!("Creating account {}", account));
        (
            account,
            false,
            vec![
                system_instruction::create_account(
                    &config.fee_payer,
                    &account,
                    minimum_balance_for_rent_exemption,
                    Account::LEN as u64,
                    &config.program_id,
                ),
                initialize_account(&config.program_id, &account, &token, &owner)?,
            ],
        )
    } else {
        let account =
            get_associated_token_address_with_program_id(&owner, &token, &config.program_id);
        println_display(config, format!("Creating account {}", account));
        (
            account,
            true,
            vec![create_associated_token_account(
                &config.fee_payer,
                &owner,
                &token,
                &config.program_id,
            )],
        )
    };

    if !config.sign_only {
        if let Some(account_data) = config
            .rpc_client
            .get_account_with_commitment(&account, config.rpc_client.commitment_config())
            .await?
        {
            if !(account_data.owner == system_program::id() && system_account_ok) {
                return Err(format!("Error: Account already exists: {}", account).into());
            }
        }
    }

    let tx_return = handle_tx(
        &CliSignerInfo {
            signers: bulk_signers,
        },
        config,
        false,
        minimum_balance_for_rent_exemption,
        instructions,
    )
    .await?;

    Ok(match tx_return {
        TransactionReturnData::CliSignature(signature) => {
            config.output_format.formatted_string(&signature)
        }
        TransactionReturnData::CliSignOnlyData(sign_only_data) => {
            config.output_format.formatted_string(&sign_only_data)
        }
    })
}

async fn command_create_multisig(
    config: &Config<'_>,
    multisig: Pubkey,
    minimum_signers: u8,
    multisig_members: Vec<Pubkey>,
    bulk_signers: BulkSigners,
) -> CommandResult {
    println_display(
        config,
        format!(
            "Creating {}/{} multisig {}",
            minimum_signers,
            multisig_members.len(),
            multisig
        ),
    );

    let minimum_balance_for_rent_exemption = if !config.sign_only {
        config
            .rpc_client
            .get_minimum_balance_for_rent_exemption(Multisig::LEN)
            .await?
    } else {
        0
    };

    let instructions = vec![
        system_instruction::create_account(
            &config.fee_payer,
            &multisig,
            minimum_balance_for_rent_exemption,
            Multisig::LEN as u64,
            &config.program_id,
        ),
        initialize_multisig(
            &config.program_id,
            &multisig,
            multisig_members.iter().collect::<Vec<_>>().as_slice(),
            minimum_signers,
        )?,
    ];

    let tx_return = handle_tx(
        &CliSignerInfo {
            signers: bulk_signers,
        },
        config,
        false,
        minimum_balance_for_rent_exemption,
        instructions,
    )
    .await?;

    Ok(match tx_return {
        TransactionReturnData::CliSignature(signature) => {
            config.output_format.formatted_string(&signature)
        }
        TransactionReturnData::CliSignOnlyData(sign_only_data) => {
            config.output_format.formatted_string(&sign_only_data)
        }
    })
}

#[allow(clippy::too_many_arguments)]
async fn command_authorize(
    config: &Config<'_>,
    account: Pubkey,
    authority_type: AuthorityType,
    authority: Pubkey,
    new_authority: Option<Pubkey>,
    force_authorize: bool,
    bulk_signers: BulkSigners,
) -> CommandResult {
    let auth_str = match authority_type {
        AuthorityType::MintTokens => "mint authority",
        AuthorityType::FreezeAccount => "freeze authority",
        AuthorityType::AccountOwner => "owner",
        AuthorityType::CloseAccount => "close authority",
    };
    let previous_authority = if !config.sign_only {
        let target_account = config.rpc_client.get_account(&account).await?;
        if let Ok(mint) = Mint::unpack(&target_account.data) {
            match authority_type {
                AuthorityType::AccountOwner | AuthorityType::CloseAccount => Err(format!(
                    "Authority type `{}` not supported for SPL Token mints",
                    auth_str
                )),
                AuthorityType::MintTokens => Ok(mint.mint_authority),
                AuthorityType::FreezeAccount => Ok(mint.freeze_authority),
            }
        } else if let Ok(token_account) = Account::unpack(&target_account.data) {
            let check_associated_token_account = || -> Result<(), CliError> {
                let maybe_associated_token_account = get_associated_token_address_with_program_id(
                    &token_account.owner,
                    &token_account.mint,
                    &config.program_id,
                );
                if account == maybe_associated_token_account
                    && !force_authorize
                    && Some(authority) != new_authority
                {
                    Err(format!(
                        "Error: attempting to change the `{}` of an associated token account",
                        auth_str
                    )
                    .into())
                } else {
                    Ok(())
                }
            };

            match authority_type {
                AuthorityType::MintTokens | AuthorityType::FreezeAccount => Err(format!(
                    "Authority type `{}` not supported for SPL Token accounts",
                    auth_str
                )),
                AuthorityType::AccountOwner => {
                    check_associated_token_account()?;
                    Ok(COption::Some(token_account.owner))
                }
                AuthorityType::CloseAccount => {
                    check_associated_token_account()?;
                    Ok(COption::Some(
                        token_account.close_authority.unwrap_or(token_account.owner),
                    ))
                }
            }
        } else {
            Err("Unsupported account data format".to_string())
        }?
    } else {
        COption::None
    };
    println_display(
        config,
        format!(
            "Updating {}\n  Current {}: {}\n  New {}: {}",
            account,
            auth_str,
            previous_authority
                .map(|pubkey| pubkey.to_string())
                .unwrap_or_else(|| "disabled".to_string()),
            auth_str,
            new_authority
                .map(|pubkey| pubkey.to_string())
                .unwrap_or_else(|| "disabled".to_string())
        ),
    );

    let instructions = vec![set_authority(
        &config.program_id,
        &account,
        new_authority.as_ref(),
        authority_type,
        &authority,
        &config.multisigner_pubkeys,
    )?];
    let tx_return = handle_tx(
        &CliSignerInfo {
            signers: bulk_signers,
        },
        config,
        false,
        0,
        instructions,
    )
    .await?;

    Ok(match tx_return {
        TransactionReturnData::CliSignature(signature) => {
            config.output_format.formatted_string(&signature)
        }
        TransactionReturnData::CliSignOnlyData(sign_only_data) => {
            config.output_format.formatted_string(&sign_only_data)
        }
    })
}

pub(crate) async fn resolve_mint_info(
    config: &Config<'_>,
    token_account: &Pubkey,
    mint_address: Option<Pubkey>,
    mint_decimals: Option<u8>,
) -> Result<(Pubkey, u8), CliError> {
    if !config.sign_only {
        let source_account = config
            .rpc_client
            .get_token_account(token_account)
            .await?
            .ok_or_else(|| format!("Could not find token account {}", token_account))?;
        let source_mint = Pubkey::from_str(&source_account.mint)?;
        if let Some(mint) = mint_address {
            if source_mint != mint {
                return Err(format!(
                    "Source {:?} does not contain {:?} tokens",
                    token_account, mint
                )
                .into());
            }
        }
        Ok((source_mint, source_account.token_amount.decimals))
    } else {
        Ok((
            mint_address.unwrap_or_default(),
            mint_decimals.unwrap_or_default(),
        ))
    }
}

async fn validate_mint(config: &Config<'_>, token: Pubkey) -> Result<(), CliError> {
    let mint = config.rpc_client.get_account(&token).await;
    if mint.is_err() || Mint::unpack(&mint.unwrap().data).is_err() {
        return Err(format!("Invalid mint account {:?}", token).into());
    }
    Ok(())
}

#[allow(clippy::too_many_arguments)]
async fn command_transfer(
    config: &Config<'_>,
    token: Pubkey,
    ui_amount: Option<f64>,
    recipient: Pubkey,
    sender: Option<Pubkey>,
    sender_owner: Pubkey,
    allow_unfunded_recipient: bool,
    fund_recipient: bool,
    mint_decimals: Option<u8>,
    recipient_is_ata_owner: bool,
    use_unchecked_instruction: bool,
    memo: Option<String>,
    bulk_signers: BulkSigners,
    no_wait: bool,
    allow_non_system_account_recipient: bool,
) -> CommandResult {
    let sender = if let Some(sender) = sender {
        sender
    } else {
        get_associated_token_address_with_program_id(&sender_owner, &token, &config.program_id)
    };
    let (mint_pubkey, decimals) =
        resolve_mint_info(config, &sender, Some(token), mint_decimals).await?;
    let maybe_transfer_balance =
        ui_amount.map(|ui_amount| spl_token::ui_amount_to_amount(ui_amount, decimals));
    let transfer_balance = if !config.sign_only {
        let sender_token_amount = config
            .rpc_client
            .get_token_account_balance(&sender)
            .await
            .map_err(|err| {
                format!(
                    "Error: Failed to get token balance of sender address {}: {}",
                    sender, err
                )
            })?;
        let sender_balance = sender_token_amount.amount.parse::<u64>().map_err(|err| {
            format!(
                "Token account {} balance could not be parsed: {}",
                sender, err
            )
        })?;

        let transfer_balance = maybe_transfer_balance.unwrap_or(sender_balance);
        println_display(
            config,
            format!(
                "Transfer {} tokens\n  Sender: {}\n  Recipient: {}",
                spl_token::amount_to_ui_amount(transfer_balance, decimals),
                sender,
                recipient
            ),
        );

        if transfer_balance > sender_balance {
            return Err(format!(
                "Error: Sender has insufficient funds, current balance is {}",
                sender_token_amount.real_number_string_trimmed()
            )
            .into());
        }
        transfer_balance
    } else {
        maybe_transfer_balance.unwrap()
    };

    let mut instructions = vec![];

    let mut recipient_token_account = recipient;
    let mut minimum_balance_for_rent_exemption = 0;

    let recipient_is_token_account = if !config.sign_only {
        let recipient_account_info = config
            .rpc_client
            .get_account_with_commitment(&recipient, config.rpc_client.commitment_config())
            .await?
            .map(|account| {
                (
                    account.owner == config.program_id && account.data.len() == Account::LEN,
                    account.owner == system_program::id(),
                )
            });
        if let Some((recipient_is_token_account, recipient_is_system_account)) =
            recipient_account_info
        {
            if !recipient_is_token_account
                && !recipient_is_system_account
                && !allow_non_system_account_recipient
            {
                return Err("Error: The recipient address is not owned by the System Program. \
                                     Add `--allow-non-system-account-recipient` to complete the transfer. \
                                    ".into());
            }
        } else if recipient_account_info.is_none() && !allow_unfunded_recipient {
            return Err("Error: The recipient address is not funded. \
                                    Add `--allow-unfunded-recipient` to complete the transfer. \
                                   "
            .into());
        }
        recipient_account_info
            .map(|(recipient_is_token_account, _)| recipient_is_token_account)
            .unwrap_or(false)
    } else {
        !recipient_is_ata_owner
    };

    if !recipient_is_token_account {
        recipient_token_account = get_associated_token_address_with_program_id(
            &recipient,
            &mint_pubkey,
            &config.program_id,
        );
        println_display(
            config,
            format!(
                "  Recipient associated token account: {}",
                recipient_token_account
            ),
        );

        let needs_funding = if !config.sign_only {
            if let Some(recipient_token_account_data) = config
                .rpc_client
                .get_account_with_commitment(
                    &recipient_token_account,
                    config.rpc_client.commitment_config(),
                )
                .await?
            {
                if recipient_token_account_data.owner == system_program::id() {
                    true
                } else if recipient_token_account_data.owner == config.program_id {
                    false
                } else {
                    return Err(
                        format!("Error: Unsupported recipient address: {}", recipient).into(),
                    );
                }
            } else {
                true
            }
        } else {
            fund_recipient
        };

        if needs_funding {
            if fund_recipient {
                if !config.sign_only {
                    minimum_balance_for_rent_exemption += config
                        .rpc_client
                        .get_minimum_balance_for_rent_exemption(Account::LEN)
                        .await?;
                    println_display(
                        config,
                        format!(
                            "  Funding recipient: {} ({} SOL)",
                            recipient_token_account,
                            lamports_to_sol(minimum_balance_for_rent_exemption)
                        ),
                    );
                }
                instructions.push(create_associated_token_account(
                    &config.fee_payer,
                    &recipient,
                    &mint_pubkey,
                    &config.program_id,
                ));
            } else {
                return Err(
                    "Error: Recipient's associated token account does not exist. \
                                    Add `--fund-recipient` to fund their account"
                        .into(),
                );
            }
        }
    }

    if use_unchecked_instruction {
        instructions.push(transfer(
            &config.program_id,
            &sender,
            &recipient_token_account,
            &sender_owner,
            &config.multisigner_pubkeys,
            transfer_balance,
        )?);
    } else {
        instructions.push(transfer_checked(
            &config.program_id,
            &sender,
            &mint_pubkey,
            &recipient_token_account,
            &sender_owner,
            &config.multisigner_pubkeys,
            transfer_balance,
            decimals,
        )?);
    }
    if let Some(text) = memo {
        instructions.push(spl_memo::build_memo(text.as_bytes(), &[&config.fee_payer]));
    }
    let tx_return = handle_tx(
        &CliSignerInfo {
            signers: bulk_signers,
        },
        config,
        no_wait,
        minimum_balance_for_rent_exemption,
        instructions,
    )
    .await?;

    Ok(match tx_return {
        TransactionReturnData::CliSignature(signature) => {
            config.output_format.formatted_string(&signature)
        }
        TransactionReturnData::CliSignOnlyData(sign_only_data) => {
            config.output_format.formatted_string(&sign_only_data)
        }
    })
}

#[allow(clippy::too_many_arguments)]
async fn command_burn(
    config: &Config<'_>,
    source: Pubkey,
    source_owner: Pubkey,
    ui_amount: f64,
    mint_address: Option<Pubkey>,
    mint_decimals: Option<u8>,
    use_unchecked_instruction: bool,
    memo: Option<String>,
    bulk_signers: BulkSigners,
) -> CommandResult {
    println_display(
        config,
        format!("Burn {} tokens\n  Source: {}", ui_amount, source),
    );

    let (mint_pubkey, decimals) =
        resolve_mint_info(config, &source, mint_address, mint_decimals).await?;
    let amount = spl_token::ui_amount_to_amount(ui_amount, decimals);

    let mut instructions = if use_unchecked_instruction {
        vec![burn(
            &config.program_id,
            &source,
            &mint_pubkey,
            &source_owner,
            &config.multisigner_pubkeys,
            amount,
        )?]
    } else {
        vec![burn_checked(
            &config.program_id,
            &source,
            &mint_pubkey,
            &source_owner,
            &config.multisigner_pubkeys,
            amount,
            decimals,
        )?]
    };
    if let Some(text) = memo {
        instructions.push(spl_memo::build_memo(text.as_bytes(), &[&config.fee_payer]));
    }
    let tx_return = handle_tx(
        &CliSignerInfo {
            signers: bulk_signers,
        },
        config,
        false,
        0,
        instructions,
    )
    .await?;

    Ok(match tx_return {
        TransactionReturnData::CliSignature(signature) => {
            config.output_format.formatted_string(&signature)
        }
        TransactionReturnData::CliSignOnlyData(sign_only_data) => {
            config.output_format.formatted_string(&sign_only_data)
        }
    })
}

#[allow(clippy::too_many_arguments)]
async fn command_mint(
    config: &Config<'_>,
    token: Pubkey,
    ui_amount: f64,
    recipient: Pubkey,
    mint_decimals: Option<u8>,
    mint_authority: Pubkey,
    use_unchecked_instruction: bool,
    bulk_signers: BulkSigners,
) -> CommandResult {
    println_display(
        config,
        format!(
            "Minting {} tokens\n  Token: {}\n  Recipient: {}",
            ui_amount, token, recipient
        ),
    );

    let (_, decimals) = resolve_mint_info(config, &recipient, None, mint_decimals).await?;
    let amount = spl_token::ui_amount_to_amount(ui_amount, decimals);

    let instructions = if use_unchecked_instruction {
        vec![mint_to(
            &config.program_id,
            &token,
            &recipient,
            &mint_authority,
            &config.multisigner_pubkeys,
            amount,
        )?]
    } else {
        vec![mint_to_checked(
            &config.program_id,
            &token,
            &recipient,
            &mint_authority,
            &config.multisigner_pubkeys,
            amount,
            decimals,
        )?]
    };
    let tx_return = handle_tx(
        &CliSignerInfo {
            signers: bulk_signers,
        },
        config,
        false,
        0,
        instructions,
    )
    .await?;

    Ok(match tx_return {
        TransactionReturnData::CliSignature(signature) => {
            config.output_format.formatted_string(&signature)
        }
        TransactionReturnData::CliSignOnlyData(sign_only_data) => {
            config.output_format.formatted_string(&sign_only_data)
        }
    })
}

async fn command_freeze(
    config: &Config<'_>,
    account: Pubkey,
    mint_address: Option<Pubkey>,
    freeze_authority: Pubkey,
    bulk_signers: BulkSigners,
) -> CommandResult {
    let (token, _) = resolve_mint_info(config, &account, mint_address, None).await?;

    println_display(
        config,
        format!("Freezing account: {}\n  Token: {}", account, token),
    );

    let instructions = vec![freeze_account(
        &config.program_id,
        &account,
        &token,
        &freeze_authority,
        &config.multisigner_pubkeys,
    )?];
    let tx_return = handle_tx(
        &CliSignerInfo {
            signers: bulk_signers,
        },
        config,
        false,
        0,
        instructions,
    )
    .await?;

    Ok(match tx_return {
        TransactionReturnData::CliSignature(signature) => {
            config.output_format.formatted_string(&signature)
        }
        TransactionReturnData::CliSignOnlyData(sign_only_data) => {
            config.output_format.formatted_string(&sign_only_data)
        }
    })
}

async fn command_thaw(
    config: &Config<'_>,
    account: Pubkey,
    mint_address: Option<Pubkey>,
    freeze_authority: Pubkey,
    bulk_signers: BulkSigners,
) -> CommandResult {
    let (token, _) = resolve_mint_info(config, &account, mint_address, None).await?;

    println_display(
        config,
        format!("Thawing account: {}\n  Token: {}", account, token),
    );

    let instructions = vec![thaw_account(
        &config.program_id,
        &account,
        &token,
        &freeze_authority,
        &config.multisigner_pubkeys,
    )?];
    let tx_return = handle_tx(
        &CliSignerInfo {
            signers: bulk_signers,
        },
        config,
        false,
        0,
        instructions,
    )
    .await?;

    Ok(match tx_return {
        TransactionReturnData::CliSignature(signature) => {
            config.output_format.formatted_string(&signature)
        }
        TransactionReturnData::CliSignOnlyData(sign_only_data) => {
            config.output_format.formatted_string(&sign_only_data)
        }
    })
}

async fn command_wrap(
    config: &Config<'_>,
    sol: f64,
    wallet_address: Pubkey,
    wrapped_sol_account: Option<Pubkey>,
    bulk_signers: BulkSigners,
) -> CommandResult {
    let lamports = sol_to_lamports(sol);

    let instructions = if let Some(wrapped_sol_account) = wrapped_sol_account {
        println_display(
            config,
            format!("Wrapping {} SOL into {}", sol, wrapped_sol_account),
        );
        vec![
            system_instruction::create_account(
                &wallet_address,
                &wrapped_sol_account,
                lamports,
                Account::LEN as u64,
                &config.program_id,
            ),
            initialize_account(
                &config.program_id,
                &wrapped_sol_account,
                &native_mint::id(),
                &wallet_address,
            )?,
        ]
    } else {
        let account = get_associated_token_address_with_program_id(
            &wallet_address,
            &native_mint::id(),
            &config.program_id,
        );

        if !config.sign_only {
            if let Some(account_data) = config
                .rpc_client
                .get_account_with_commitment(&account, config.rpc_client.commitment_config())
                .await?
            {
                if account_data.owner != system_program::id() {
                    return Err(format!("Error: Account already exists: {}", account).into());
                }
            }
        }

        println_display(config, format!("Wrapping {} SOL into {}", sol, account));
        vec![
            system_instruction::transfer(&wallet_address, &account, lamports),
            create_associated_token_account(
                &config.fee_payer,
                &wallet_address,
                &native_mint::id(),
                &config.program_id,
            ),
        ]
    };
    if !config.sign_only {
        check_wallet_balance(config, &wallet_address, lamports).await?;
    }
    let tx_return = handle_tx(
        &CliSignerInfo {
            signers: bulk_signers,
        },
        config,
        false,
        0,
        instructions,
    )
    .await?;

    Ok(match tx_return {
        TransactionReturnData::CliSignature(signature) => {
            config.output_format.formatted_string(&signature)
        }
        TransactionReturnData::CliSignOnlyData(sign_only_data) => {
            config.output_format.formatted_string(&sign_only_data)
        }
    })
}

async fn command_unwrap(
    config: &Config<'_>,
    wallet_address: Pubkey,
    address: Option<Pubkey>,
    bulk_signers: BulkSigners,
) -> CommandResult {
    let use_associated_account = address.is_none();
    let address = address.unwrap_or_else(|| {
        get_associated_token_address_with_program_id(
            &wallet_address,
            &native_mint::id(),
            &config.program_id,
        )
    });
    println_display(config, format!("Unwrapping {}", address));
    if !config.sign_only {
        let lamports = config.rpc_client.get_balance(&address).await?;
        if lamports == 0 {
            if use_associated_account {
                return Err("No wrapped SOL in associated account; did you mean to specify an auxiliary address?".to_string().into());
            } else {
                return Err(format!("No wrapped SOL in {}", address).into());
            }
        }
        println_display(
            config,
            format!("  Amount: {} SOL", lamports_to_sol(lamports)),
        );
    }
    println_display(config, format!("  Recipient: {}", &wallet_address));

    let instructions = vec![close_account(
        &config.program_id,
        &address,
        &wallet_address,
        &wallet_address,
        &config.multisigner_pubkeys,
    )?];
    let tx_return = handle_tx(
        &CliSignerInfo {
            signers: bulk_signers,
        },
        config,
        false,
        0,
        instructions,
    )
    .await?;

    Ok(match tx_return {
        TransactionReturnData::CliSignature(signature) => {
            config.output_format.formatted_string(&signature)
        }
        TransactionReturnData::CliSignOnlyData(sign_only_data) => {
            config.output_format.formatted_string(&sign_only_data)
        }
    })
}

#[allow(clippy::too_many_arguments)]
async fn command_approve(
    config: &Config<'_>,
    account: Pubkey,
    owner: Pubkey,
    ui_amount: f64,
    delegate: Pubkey,
    mint_address: Option<Pubkey>,
    mint_decimals: Option<u8>,
    use_unchecked_instruction: bool,
    bulk_signers: BulkSigners,
) -> CommandResult {
    println_display(
        config,
        format!(
            "Approve {} tokens\n  Account: {}\n  Delegate: {}",
            ui_amount, account, delegate
        ),
    );

    let (mint_pubkey, decimals) =
        resolve_mint_info(config, &account, mint_address, mint_decimals).await?;
    let amount = spl_token::ui_amount_to_amount(ui_amount, decimals);

    let instructions = if use_unchecked_instruction {
        vec![approve(
            &config.program_id,
            &account,
            &delegate,
            &owner,
            &config.multisigner_pubkeys,
            amount,
        )?]
    } else {
        vec![approve_checked(
            &config.program_id,
            &account,
            &mint_pubkey,
            &delegate,
            &owner,
            &config.multisigner_pubkeys,
            amount,
            decimals,
        )?]
    };
    let tx_return = handle_tx(
        &CliSignerInfo {
            signers: bulk_signers,
        },
        config,
        false,
        0,
        instructions,
    )
    .await?;

    Ok(match tx_return {
        TransactionReturnData::CliSignature(signature) => {
            config.output_format.formatted_string(&signature)
        }
        TransactionReturnData::CliSignOnlyData(sign_only_data) => {
            config.output_format.formatted_string(&sign_only_data)
        }
    })
}

async fn command_revoke(
    config: &Config<'_>,
    account: Pubkey,
    owner: Pubkey,
    delegate: Option<Pubkey>,
    bulk_signers: BulkSigners,
) -> CommandResult {
    let delegate = if !config.sign_only {
        let source_account = config
            .rpc_client
            .get_token_account(&account)
            .await?
            .ok_or_else(|| format!("Could not find token account {}", account))?;

        if let Some(string) = source_account.delegate {
            Some(Pubkey::from_str(&string)?)
        } else {
            None
        }
    } else {
        delegate
    };

    if let Some(delegate) = delegate {
        println_display(
            config,
            format!(
                "Revoking approval\n  Account: {}\n  Delegate: {}",
                account, delegate
            ),
        );
    } else {
        return Err(format!("No delegate on account {}", account).into());
    }

    let instructions = vec![revoke(
        &config.program_id,
        &account,
        &owner,
        &config.multisigner_pubkeys,
    )?];
    let tx_return = handle_tx(
        &CliSignerInfo {
            signers: bulk_signers,
        },
        config,
        false,
        0,
        instructions,
    )
    .await?;

    Ok(match tx_return {
        TransactionReturnData::CliSignature(signature) => {
            config.output_format.formatted_string(&signature)
        }
        TransactionReturnData::CliSignOnlyData(sign_only_data) => {
            config.output_format.formatted_string(&sign_only_data)
        }
    })
}

async fn command_close(
    config: &Config<'_>,
    account: Pubkey,
    close_authority: Pubkey,
    recipient: Pubkey,
    bulk_signers: BulkSigners,
) -> CommandResult {
    if !config.sign_only {
        let source_account = config
            .rpc_client
            .get_token_account(&account)
            .await?
            .ok_or_else(|| format!("Could not find token account {}", account))?;
        let source_amount = source_account
            .token_amount
            .amount
            .parse::<u64>()
            .map_err(|err| {
                format!(
                    "Token account {} balance could not be parsed: {}",
                    account, err
                )
            })?;

        if !source_account.is_native && source_amount > 0 {
            return Err(format!(
                "Account {} still has {} tokens; empty the account in order to close it.",
                account,
                source_account.token_amount.real_number_string_trimmed()
            )
            .into());
        }
    }

    let instructions = vec![close_account(
        &config.program_id,
        &account,
        &recipient,
        &close_authority,
        &config.multisigner_pubkeys,
    )?];
    let tx_return = handle_tx(
        &CliSignerInfo {
            signers: bulk_signers,
        },
        config,
        false,
        0,
        instructions,
    )
    .await?;

    Ok(match tx_return {
        TransactionReturnData::CliSignature(signature) => {
            config.output_format.formatted_string(&signature)
        }
        TransactionReturnData::CliSignOnlyData(sign_only_data) => {
            config.output_format.formatted_string(&sign_only_data)
        }
    })
}

async fn command_balance(config: &Config<'_>, address: Pubkey) -> CommandResult {
    let balance = config
        .rpc_client
        .get_token_account_balance(&address)
        .await
        .map_err(|_| format!("Could not find token account {}", address))?;
    let cli_token_amount = CliTokenAmount { amount: balance };
    Ok(config.output_format.formatted_string(&cli_token_amount))
}

async fn command_supply(config: &Config<'_>, address: Pubkey) -> CommandResult {
    let supply = config.rpc_client.get_token_supply(&address).await?;
    let cli_token_amount = CliTokenAmount { amount: supply };
    Ok(config.output_format.formatted_string(&cli_token_amount))
}

async fn command_accounts(
    config: &Config<'_>,
    token: Option<Pubkey>,
    owner: Pubkey,
) -> CommandResult {
    if let Some(token) = token {
        validate_mint(config, token).await?;
    }
    let accounts = config
        .rpc_client
        .get_token_accounts_by_owner(
            &owner,
            match token {
                Some(token) => RpcTokenAccountsFilter::Mint(token),
                None => RpcTokenAccountsFilter::ProgramId(config.program_id),
            },
        )
        .await?;
    if accounts.is_empty() {
        PgTerminal::log_wasm("None");
        return Ok("".to_string());
    }

    let (mint_accounts, unsupported_accounts, max_len_balance, includes_aux) =
        sort_and_parse_token_accounts(&owner, accounts, &config.program_id);
    let aux_len = if includes_aux { 10 } else { 0 };

    let cli_token_accounts = CliTokenAccounts {
        accounts: mint_accounts.into_values().collect(),
        unsupported_accounts,
        max_len_balance,
        aux_len,
        token_is_some: token.is_some(),
    };
    Ok(config.output_format.formatted_string(&cli_token_accounts))
}

async fn command_address(
    config: &Config<'_>,
    token: Option<Pubkey>,
    owner: Pubkey,
) -> CommandResult {
    let mut cli_address = CliWalletAddress {
        wallet_address: owner.to_string(),
        ..CliWalletAddress::default()
    };
    if let Some(token) = token {
        validate_mint(config, token).await?;
        let associated_token_address =
            get_associated_token_address_with_program_id(&owner, &token, &config.program_id);
        cli_address.associated_token_address = Some(associated_token_address.to_string());
    }
    Ok(config.output_format.formatted_string(&cli_address))
}

async fn command_account_info(config: &Config<'_>, address: Pubkey) -> CommandResult {
    let account = config
        .rpc_client
        .get_token_account(&address)
        .await
        .map_err(|_| format!("Could not find token account {}", address))?
        .unwrap();
    let mint = Pubkey::from_str(&account.mint).unwrap();
    let owner = Pubkey::from_str(&account.owner).unwrap();
    let is_associated =
        get_associated_token_address_with_program_id(&owner, &mint, &config.program_id) == address;
    let cli_token_account = CliTokenAccount {
        address: address.to_string(),
        is_associated,
        account,
    };
    Ok(config.output_format.formatted_string(&cli_token_account))
}

async fn get_multisig(config: &Config<'_>, address: &Pubkey) -> Result<Multisig, CliError> {
    let account = config.rpc_client.get_account(address).await?;
    Multisig::unpack(&account.data).map_err(|e| e.into())
}

async fn command_multisig(config: &Config<'_>, address: Pubkey) -> CommandResult {
    let multisig = get_multisig(config, &address).await?;
    let n = multisig.n as usize;
    assert!(n <= multisig.signers.len());
    let cli_multisig = CliMultisig {
        address: address.to_string(),
        m: multisig.m,
        n: multisig.n,
        signers: multisig
            .signers
            .iter()
            .enumerate()
            .filter_map(|(i, signer)| {
                if i < n {
                    Some(signer.to_string())
                } else {
                    None
                }
            })
            .collect(),
    };
    Ok(config.output_format.formatted_string(&cli_multisig))
}

async fn command_gc(
    config: &Config<'_>,
    owner: Pubkey,
    close_empty_associated_accounts: bool,
    bulk_signers: BulkSigners,
) -> CommandResult {
    println_display(config, "Fetching token accounts".to_string());
    let accounts = config
        .rpc_client
        .get_token_accounts_by_owner(&owner, RpcTokenAccountsFilter::ProgramId(config.program_id))
        .await?;
    if accounts.is_empty() {
        println_display(config, "Nothing to do".to_string());
        return Ok("".to_string());
    }

    let minimum_balance_for_rent_exemption = if !config.sign_only {
        config
            .rpc_client
            .get_minimum_balance_for_rent_exemption(Account::LEN)
            .await?
    } else {
        0
    };

    let mut accounts_by_token = HashMap::new();

    for keyed_account in accounts {
        if let UiAccountData::Json(parsed_account) = keyed_account.account.data {
            if parsed_account.program == "spl-token" {
                if let Ok(TokenAccountType::Account(ui_token_account)) =
                    serde_json::from_value(parsed_account.parsed)
                {
                    let frozen = ui_token_account.state == UiAccountState::Frozen;

                    let token = ui_token_account
                        .mint
                        .parse::<Pubkey>()
                        .unwrap_or_else(|err| panic!("Invalid mint: {}", err));
                    let token_account = keyed_account
                        .pubkey
                        .parse::<Pubkey>()
                        .unwrap_or_else(|err| panic!("Invalid token account: {}", err));
                    let token_amount = ui_token_account
                        .token_amount
                        .amount
                        .parse::<u64>()
                        .unwrap_or_else(|err| panic!("Invalid token amount: {}", err));

                    let close_authority = ui_token_account.close_authority.map_or(owner, |s| {
                        s.parse::<Pubkey>()
                            .unwrap_or_else(|err| panic!("Invalid close authority: {}", err))
                    });

                    let entry = accounts_by_token.entry(token).or_insert_with(HashMap::new);
                    entry.insert(
                        token_account,
                        (
                            token_amount,
                            ui_token_account.token_amount.decimals,
                            frozen,
                            close_authority,
                        ),
                    );
                }
            }
        }
    }

    let mut instructions = vec![];
    let mut lamports_needed = 0;

    for (token, accounts) in accounts_by_token.into_iter() {
        println_display(config, format!("Processing token: {}", token));
        let associated_token_account =
            get_associated_token_address_with_program_id(&owner, &token, &config.program_id);
        let total_balance: u64 = accounts.values().map(|account| account.0).sum();

        if total_balance > 0 && !accounts.contains_key(&associated_token_account) {
            // Create the associated token account
            instructions.push(vec![create_associated_token_account(
                &config.fee_payer,
                &owner,
                &token,
                &config.program_id,
            )]);
            lamports_needed += minimum_balance_for_rent_exemption;
        }

        for (address, (amount, decimals, frozen, close_authority)) in accounts {
            match (
                address == associated_token_account,
                close_empty_associated_accounts,
                total_balance > 0,
            ) {
                (true, _, true) => continue, // don't ever close associated token account with amount
                (true, false, _) => continue, // don't close associated token account if close_empty_associated_accounts isn't set
                (true, true, false) => println_display(
                    config,
                    format!("Closing Account {}", associated_token_account),
                ),
                _ => {}
            }

            if frozen {
                // leave frozen accounts alone
                continue;
            }

            let mut account_instructions = vec![];

            // Sanity check!
            // we shouldn't ever be here, but if we are here, abort!
            assert!(amount == 0 || address != associated_token_account);

            if amount > 0 {
                // Transfer the account balance into the associated token account
                account_instructions.push(transfer_checked(
                    &config.program_id,
                    &address,
                    &token,
                    &associated_token_account,
                    &owner,
                    &config.multisigner_pubkeys,
                    amount,
                    decimals,
                )?);
            }
            // Close the account if config.owner is able to
            if close_authority == owner {
                account_instructions.push(close_account(
                    &config.program_id,
                    &address,
                    &owner,
                    &owner,
                    &config.multisigner_pubkeys,
                )?);
            }

            if !account_instructions.is_empty() {
                instructions.push(account_instructions);
            }
        }
    }

    let cli_signer_info = CliSignerInfo {
        signers: bulk_signers,
    };

    let mut result = String::from("");
    for tx_instructions in instructions {
        let tx_return = handle_tx(
            &cli_signer_info,
            config,
            false,
            lamports_needed,
            tx_instructions,
        )
        .await?;
        result += &match tx_return {
            TransactionReturnData::CliSignature(signature) => {
                config.output_format.formatted_string(&signature)
            }
            TransactionReturnData::CliSignOnlyData(sign_only_data) => {
                config.output_format.formatted_string(&sign_only_data)
            }
        };
        result += "\n";
    }
    Ok(result)
}

async fn command_sync_native(
    config: &Config<'_>,
    native_account_address: Pubkey,
    bulk_signers: BulkSigners,
) -> CommandResult {
    let tx_return = handle_tx(
        &CliSignerInfo {
            signers: bulk_signers,
        },
        config,
        false,
        0,
        vec![sync_native(&config.program_id, &native_account_address)?],
    )
    .await?;

    Ok(match tx_return {
        TransactionReturnData::CliSignature(signature) => {
            config.output_format.formatted_string(&signature)
        }
        TransactionReturnData::CliSignOnlyData(sign_only_data) => {
            config.output_format.formatted_string(&sign_only_data)
        }
    })
}

enum TransactionReturnData {
    CliSignature(CliSignature),
    CliSignOnlyData(CliSignOnlyData),
}

async fn handle_tx(
    signer_info: &CliSignerInfo,
    config: &Config<'_>,
    no_wait: bool,
    minimum_balance_for_rent_exemption: u64,
    instructions: Vec<Instruction>,
) -> Result<TransactionReturnData, Box<dyn std::error::Error>> {
    let fee_payer = Some(&config.fee_payer);

    let message = if let Some(nonce_account) = config.nonce_account.as_ref() {
        Message::new_with_nonce(
            instructions,
            fee_payer,
            nonce_account,
            config.nonce_authority.as_ref().unwrap(),
        )
    } else {
        Message::new(&instructions, fee_payer)
    };

    let recent_blockhash = config
        .blockhash_query
        .get_blockhash(&config.rpc_client, config.rpc_client.commitment_config())
        .await?;

    let fee = config.rpc_client.get_fee_for_message(&message).await?;

    if !config.sign_only {
        check_fee_payer_balance(config, minimum_balance_for_rent_exemption + fee).await?;
    }

    let signers = signer_info.signers_for_message(&message);
    let mut transaction = Transaction::new_unsigned(message);

    if config.sign_only {
        transaction.try_partial_sign(&signers, recent_blockhash)?;
        Ok(TransactionReturnData::CliSignOnlyData(return_signers_data(
            &transaction,
            &ReturnSignersConfig {
                dump_transaction_message: config.dump_transaction_message,
            },
        )))
    } else {
        transaction.try_sign(&signers, recent_blockhash)?;
        let signature = if no_wait {
            config.rpc_client.send_transaction(&transaction).await?
        } else {
            // TODO:
            config
                .rpc_client
                .send_and_confirm_transaction(&transaction)
                .await?
        };
        Ok(TransactionReturnData::CliSignature(CliSignature {
            signature: signature.to_string(),
        }))
    }
}
