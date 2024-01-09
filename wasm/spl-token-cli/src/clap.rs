use std::str::FromStr;

use clap::{Arg, Command};
use solana_clap_v3_utils_wasm::{
    input_validators::{
        is_amount, is_amount_or_all, is_parsable, is_url_or_moniker, is_valid_pubkey,
        is_valid_signer,
    },
    memo::memo_arg,
    nonce::NonceArgs,
    offline,
    offline::{OfflineArgs, BLOCKHASH_ARG, SIGN_ONLY_ARG},
    ArgConstant,
};
use solana_extra_wasm::program::spl_token::instruction::{MAX_SIGNERS, MIN_SIGNERS};

use crate::cli::CommandName;

pub const OWNER_ADDRESS_ARG: ArgConstant<'static> = ArgConstant {
    name: "owner",
    long: "owner",
    help: "Address of the token's owner. Defaults to the client keypair address.",
};

pub const OWNER_KEYPAIR_ARG: ArgConstant<'static> = ArgConstant {
    name: "owner",
    long: "owner",
    help: "Keypair of the token's owner. Defaults to the client keypair.",
};

pub const MINT_ADDRESS_ARG: ArgConstant<'static> = ArgConstant {
    name: "mint_address",
    long: "mint-address",
    help: "Address of mint that token account is associated with. Required by --sign-only",
};

pub const MINT_DECIMALS_ARG: ArgConstant<'static> = ArgConstant {
    name: "mint_decimals",
    long: "mint-decimals",
    help: "Decimals of mint that token account is associated with. Required by --sign-only",
};

pub const DELEGATE_ADDRESS_ARG: ArgConstant<'static> = ArgConstant {
    name: "delegate_address",
    long: "delegate-address",
    help: "Address of delegate currently assigned to token account. Required by --sign-only",
};

pub const MULTISIG_SIGNER_ARG: ArgConstant<'static> = ArgConstant {
    name: "multisig_signer",
    long: "multisig-signer",
    help: "Member signer of a multisig account",
};

struct SignOnlyNeedsFullMintSpec {}
impl offline::ArgsConfig for SignOnlyNeedsFullMintSpec {
    fn sign_only_arg<'a>(&self, arg: Arg<'a>) -> Arg<'a> {
        arg.requires_all(&[MINT_ADDRESS_ARG.name, MINT_DECIMALS_ARG.name])
    }
}

pub fn owner_address_arg<'a>() -> Arg<'a> {
    Arg::new(OWNER_ADDRESS_ARG.name)
        .long(OWNER_ADDRESS_ARG.long)
        .takes_value(true)
        .value_name("OWNER_ADDRESS")
        .validator(is_valid_pubkey)
        .help(OWNER_ADDRESS_ARG.help)
}

pub fn owner_keypair_arg_with_value_name<'a>(value_name: &'static str) -> Arg<'a> {
    Arg::new(OWNER_KEYPAIR_ARG.name)
        .long(OWNER_KEYPAIR_ARG.long)
        .takes_value(true)
        .value_name(value_name)
        .validator(is_valid_signer)
        .help(OWNER_KEYPAIR_ARG.help)
}

pub fn owner_keypair_arg<'a>() -> Arg<'a> {
    owner_keypair_arg_with_value_name("OWNER_KEYPAIR")
}

pub fn mint_address_arg<'a>() -> Arg<'a> {
    Arg::new(MINT_ADDRESS_ARG.name)
        .long(MINT_ADDRESS_ARG.long)
        .takes_value(true)
        .value_name("MINT_ADDRESS")
        .validator(is_valid_pubkey)
        .requires(SIGN_ONLY_ARG.name)
        .requires(BLOCKHASH_ARG.name)
        .help(MINT_ADDRESS_ARG.help)
}

fn is_mint_decimals(str: &str) -> Result<(), String> {
    is_parsable::<u8>(str)
}

pub fn mint_decimals_arg<'a>() -> Arg<'a> {
    Arg::new(MINT_DECIMALS_ARG.name)
        .long(MINT_DECIMALS_ARG.long)
        .takes_value(true)
        .value_name("MINT_DECIMALS")
        .validator(is_mint_decimals)
        .requires(SIGN_ONLY_ARG.name)
        .requires(BLOCKHASH_ARG.name)
        .help(MINT_DECIMALS_ARG.help)
}

pub trait MintArgs {
    fn mint_args(self) -> Self;
}

impl MintArgs for Command<'_> {
    fn mint_args(self) -> Self {
        self.arg(mint_address_arg().requires(MINT_DECIMALS_ARG.name))
            .arg(mint_decimals_arg().requires(MINT_ADDRESS_ARG.name))
    }
}

pub fn delegate_address_arg<'a>() -> Arg<'a> {
    Arg::new(DELEGATE_ADDRESS_ARG.name)
        .long(DELEGATE_ADDRESS_ARG.long)
        .takes_value(true)
        .value_name("DELEGATE_ADDRESS")
        .validator(is_valid_pubkey)
        .requires(SIGN_ONLY_ARG.name)
        .requires(BLOCKHASH_ARG.name)
        .help(DELEGATE_ADDRESS_ARG.help)
}

pub fn multisig_signer_arg<'a>() -> Arg<'a> {
    Arg::new(MULTISIG_SIGNER_ARG.name)
        .long(MULTISIG_SIGNER_ARG.long)
        .validator(is_valid_signer)
        .value_name("MULTISIG_SIGNER")
        .takes_value(true)
        .multiple_occurrences(true)
        .min_values(0)
        .max_values(MAX_SIGNERS)
        .help(MULTISIG_SIGNER_ARG.help)
}

fn is_multisig_minimum_signers(string: &str) -> Result<(), String> {
    let v = u8::from_str(string).map_err(|e| e.to_string())? as usize;
    if v < MIN_SIGNERS {
        Err(format!("must be at least {}", MIN_SIGNERS))
    } else if v > MAX_SIGNERS {
        Err(format!("must be at most {}", MAX_SIGNERS))
    } else {
        Ok(())
    }
}

struct SignOnlyNeedsMintDecimals {}
impl offline::ArgsConfig for SignOnlyNeedsMintDecimals {
    fn sign_only_arg<'a>(&self, arg: Arg<'a>) -> Arg<'a> {
        arg.requires_all(&[MINT_DECIMALS_ARG.name])
    }
}

struct SignOnlyNeedsMintAddress {}
impl offline::ArgsConfig for SignOnlyNeedsMintAddress {
    fn sign_only_arg<'a>(&self, arg: Arg<'a>) -> Arg<'a> {
        arg.requires_all(&[MINT_ADDRESS_ARG.name])
    }
}

struct SignOnlyNeedsDelegateAddress {}
impl offline::ArgsConfig for SignOnlyNeedsDelegateAddress {
    fn sign_only_arg<'a>(&self, arg: Arg<'a>) -> Arg<'a> {
        arg.requires_all(&[DELEGATE_ADDRESS_ARG.name])
    }
}

pub fn get_clap<'a>(
    name: &str,
    about: &'a str,
    version: &'a str,
    default_decimals: &'a str,
    default_program_id: &'a str,
) -> Command<'a> {
    Command::new(name)
        .about(about)
        .version(version)
        .subcommand_required(true)
        .arg_required_else_help(true)
//         .arg({
//             let arg = Arg::new("config_file")
//                 .short('C')
//                 .long("config")
//                 .value_name("PATH")
//                 .takes_value(true)
//                 .global(true)
//                 .help("Configuration file to use");
//             if let Some(ref config_file) = *solana_cli_config_wasm::CONFIG_FILE {
//                 arg.default_value(config_file)
//             } else {
//                 arg
//             }
//         })
        .arg(
            Arg::new("verbose")
                .short('v')
                .long("verbose")
                .takes_value(false)
                .global(true)
                .help("Show additional information"),
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
            Arg::new("program_id")
                .short('p')
                .long("program-id")
                .value_name("ADDRESS")
                .takes_value(true)
                .global(true)
                .default_value(default_program_id)
                .validator(is_valid_pubkey)
                .help("SPL Token program id"),
        )
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
                       [mainnet-beta, testnet, devnet, localhost] \
                    Default from the configuration file."
                ),
        )
        // TODO:
        // .arg(fee_payer_arg().global(true))
        .arg(
            Arg::new("use_unchecked_instruction")
                .long("use-unchecked-instruction")
                .takes_value(false)
                .global(true)
                .hide(true)
                .help("Use unchecked instruction if appropriate. Supports transfer, burn, mint, and approve."),
        )
//         .bench_subcommand()
        .subcommand(Command::new(CommandName::CreateToken.to_string()).about("Create a new token")
                .arg(
                    Arg::new("token_keypair")
                        .value_name("TOKEN_KEYPAIR")
                        .validator(is_valid_signer)
                        .takes_value(true)
                        .index(1)
                        .help(
                            "Specify the token keypair. \
                             This may be a keypair file or the ASK keyword. \
                             [default: randomly generated keypair]"
                        ),
                )
                .arg(
                    Arg::new("mint_authority")
                        .long("mint-authority")
                        .alias("owner")
                        .value_name("ADDRESS")
                        .validator(is_valid_pubkey)
                        .takes_value(true)
                        .help(
                            "Specify the mint authority address. \
                             Defaults to the client keypair address."
                        ),
                )
                .arg(
                    Arg::new("decimals")
                        .long("decimals")
                        .validator(is_mint_decimals)
                        .value_name("DECIMALS")
                        .takes_value(true)
                        .default_value(default_decimals)
                        .help("Number of base 10 digits to the right of the decimal place"),
                )
                .arg(
                    Arg::new("enable_freeze")
                        .long("enable-freeze")
                        .takes_value(false)
                        .help(
                            "Enable the mint authority to freeze associated token accounts."
                        ),
                )
                .nonce_args(true)
                .arg(memo_arg())
                .offline_args(),
        )
        .subcommand(
            Command::new(CommandName::CreateAccount.to_string())
                .about("Create a new token account")
                .arg(
                    Arg::new("token")
                        .validator(is_valid_pubkey)
                        .value_name("TOKEN_ADDRESS")
                        .takes_value(true)
                        .index(1)
                        .required(true)
                        .help("The token that the account will hold"),
                )
                .arg(
                    Arg::new("account_keypair")
                        .value_name("ACCOUNT_KEYPAIR")
                        .validator(is_valid_signer)
                        .takes_value(true)
                        .index(2)
                        .help(
                            "Specify the account keypair. \
                             This may be a keypair file or the ASK keyword. \
                             [default: associated token account for --owner]"
                        ),
                )
                .arg(owner_address_arg())
                .nonce_args(true)
                .offline_args(),
        )
        .subcommand(
            Command::new(CommandName::CreateMultisig.to_string())
                .about("Create a new account describing an M:N multisignature")
                .arg(
                    Arg::new("minimum_signers")
                        .value_name("MINIMUM_SIGNERS")
                        .validator(is_multisig_minimum_signers)
                        .takes_value(true)
                        .index(1)
                        .required(true)
                        .help(
        "The minimum number of signers required to allow the operation. [1 <= M <= N]",
    ),
                )
                .arg(
                    Arg::new("multisig_member")
                        .value_name("MULTISIG_MEMBER_PUBKEY")
                        .validator(is_valid_pubkey)
                        .takes_value(true)
                        .index(2)
                        .required(true)
                        .min_values(MIN_SIGNERS)
                        .max_values(MAX_SIGNERS)
                        .help(
        "The public keys for each of the N signing members of this account. [1 <= N <= 1]",
    ),
                )
                .arg(
                    Arg::new("address_keypair")
                        .long("address-keypair")
                        .value_name("ADDRESS_KEYPAIR")
                        .validator(is_valid_signer)
                        .takes_value(true)
                        .help(
                            "Specify the address keypair. \
                             This may be a keypair file or the ASK keyword. \
                             [default: randomly generated keypair]"
                        ),
                )
                .nonce_args(true)
                .offline_args(),
        )
        .subcommand(
            Command::new(CommandName::Authorize.to_string())
                .about("Authorize a new signing keypair to a token or token account")
                .arg(
                    Arg::new("address")
                        .validator(is_valid_pubkey)
                        .value_name("TOKEN_ADDRESS")
                        .takes_value(true)
                        .index(1)
                        .required(true)
                        .help("The address of the token account"),
                )
                .arg(
                    Arg::new("authority_type")
                        .value_name("AUTHORITY_TYPE")
                        .takes_value(true)
                        .possible_values(["mint", "freeze", "owner", "close"])
                        .index(2)
                        .required(true)
                        .help("The new authority type. \
                            Token mints support `mint` and `freeze` authorities;\
                            Token accounts support `owner` and `close` authorities."),
                )
                .arg(
                    Arg::new("new_authority")
                        .validator(is_valid_pubkey)
                        .value_name("AUTHORITY_ADDRESS")
                        .takes_value(true)
                        .index(3)
                        .required_unless_present("disable")
                        .help("The address of the new authority"),
                )
                .arg(
                    Arg::new("authority")
                        .long("authority")
                        .alias("owner")
                        .value_name("KEYPAIR")
                        .validator(is_valid_signer)
                        .takes_value(true)
                        .help(
                            "Specify the current authority keypair. \
                             Defaults to the client keypair."
                        ),
                )
                .arg(
                    Arg::new("disable")
                        .long("disable")
                        .takes_value(false)
                        .conflicts_with("new_authority")
                        .help("Disable mint, freeze, or close functionality by setting authority to None.")
                )
                .arg(
                    Arg::new("force")
                        .long("force")
                        .hide(true)
                        .help("Force re-authorize the wallet's associate token account. Don't use this flag"),
                )
                .arg(multisig_signer_arg())
                .nonce_args(true)
                .offline_args(),
        )
        .subcommand(
            Command::new(CommandName::Transfer.to_string())
                .about("Transfer tokens between accounts")
                .arg(
                    Arg::new("token")
                        .validator(is_valid_pubkey)
                        .value_name("TOKEN_ADDRESS")
                        .takes_value(true)
                        .index(1)
                        .required(true)
                        .help("Token to transfer"),
                )
                .arg(
                    Arg::new("amount")
                        .validator(is_amount_or_all)
                        .value_name("TOKEN_AMOUNT")
                        .takes_value(true)
                        .index(2)
                        .required(true)
                        .help("Amount to send, in tokens; accepts keyword ALL"),
                )
                .arg(
                    Arg::new("recipient")
                        .validator(is_valid_pubkey)
                        .value_name("RECIPIENT_ADDRESS or RECIPIENT_TOKEN_ACCOUNT_ADDRESS")
                        .takes_value(true)
                        .index(3)
                        .required(true)
                        .help("If a token account address is provided, use it as the recipient. \
                               Otherwise assume the recipient address is a user wallet and transfer to \
                               the associated token account")
                )
                .arg(
                    Arg::new("from")
                        .validator(is_valid_pubkey)
                        .value_name("SENDER_TOKEN_ACCOUNT_ADDRESS")
                        .takes_value(true)
                        .long("from")
                        .help("Specify the sending token account \
                            [default: owner's associated token account]")
                )
                .arg(owner_keypair_arg_with_value_name("SENDER_TOKEN_OWNER_KEYPAIR")
                        .help(
                            "Specify the owner of the sending token account. \
                            This may be a keypair file, the ASK keyword. \
                            Defaults to the client keypair.",
                        ),
                )
                .arg(
                    Arg::new("allow_unfunded_recipient")
                        .long("allow-unfunded-recipient")
                        .takes_value(false)
                        .help("Complete the transfer even if the recipient address is not funded")
                )
                .arg(
                    Arg::new("allow_empty_recipient")
                        .long("allow-empty-recipient")
                        .takes_value(false)
                        .hide(true) // Deprecated, use --allow-unfunded-recipient instead
                )
                .arg(
                    Arg::new("fund_recipient")
                        .long("fund-recipient")
                        .takes_value(false)
                        .help("Create the associated token account for the recipient if doesn't already exist")
                )
                .arg(
                    Arg::new("no_wait")
                        .long("no-wait")
                        .takes_value(false)
                        .help("Return signature immediately after submitting the transaction, instead of waiting for confirmations"),
                )
                .arg(
                    Arg::new("allow_non_system_account_recipient")
                        .long("allow-non-system-account-recipient")
                        .takes_value(false)
                        .help("Send tokens to the recipient even if the recipient is not a wallet owned by System Program."),
                )
                .arg(
                    Arg::new("recipient_is_ata_owner")
                        .long("recipient-is-ata-owner")
                        .takes_value(false)
                        .requires("sign_only")
                        .help("In sign-only mode, specifies that the recipient is the owner of the associated token account rather than an actual token account"),
                )
                .arg(multisig_signer_arg())
                .arg(mint_decimals_arg())
                .nonce_args(true)
                .arg(memo_arg())
                .offline_args_config(&SignOnlyNeedsMintDecimals{}),
        )
        .subcommand(
            Command::new(CommandName::Burn.to_string())
                .about("Burn tokens from an account")
                .arg(
                    Arg::new("source")
                        .validator(is_valid_pubkey)
                        .value_name("SOURCE_TOKEN_ACCOUNT_ADDRESS")
                        .takes_value(true)
                        .index(1)
                        .required(true)
                        .help("The token account address to burn from"),
                )
                .arg(
                    Arg::new("amount")
                        .validator(is_amount)
                        .value_name("TOKEN_AMOUNT")
                        .takes_value(true)
                        .index(2)
                        .required(true)
                        .help("Amount to burn, in tokens"),
                )
                // .arg(owner_keypair_arg_with_value_name("SOURCE_TOKEN_OWNER_KEYPAIR")
                //         .help(
                //             "Specify the source token owner account. \
                //             This may be a keypair file, the ASK keyword. \
                //             Defaults to the client keypair.",
                //         ),
                // )
                .arg(multisig_signer_arg())
                .mint_args()
                .nonce_args(true)
                .arg(memo_arg())
                .offline_args_config(&SignOnlyNeedsFullMintSpec{}),
        )
        .subcommand(
            Command::new(CommandName::Mint.to_string())
                .about("Mint new tokens")
                .arg(
                    Arg::new("token")
                        .validator(is_valid_pubkey)
                        .value_name("TOKEN_ADDRESS")
                        .takes_value(true)
                        .index(1)
                        .required(true)
                        .help("The token to mint"),
                )
                .arg(
                    Arg::new("amount")
                        .validator(is_amount)
                        .value_name("TOKEN_AMOUNT")
                        .takes_value(true)
                        .index(2)
                        .required(true)
                        .help("Amount to mint, in tokens"),
                )
                .arg(
                    Arg::new("recipient")
                        .validator(is_valid_pubkey)
                        .value_name("RECIPIENT_TOKEN_ACCOUNT_ADDRESS")
                        .takes_value(true)
                        .index(3)
                        .help("The token account address of recipient [default: associated token account for --owner]"),
                )
                .arg(
                    Arg::new("mint_authority")
                        .long("mint-authority")
                        .alias("owner")
                        .value_name("KEYPAIR")
                        .validator(is_valid_signer)
                        .takes_value(true)
                        .help(
                            "Specify the mint authority keypair. \
                             This may be a keypair file or the ASK keyword. \
                             Defaults to the client keypair."
                        ),
                )
                .arg(mint_decimals_arg())
                .arg(multisig_signer_arg())
                .nonce_args(true)
                .offline_args_config(&SignOnlyNeedsMintDecimals{}),
        )
        .subcommand(
            Command::new(CommandName::Freeze.to_string())
                .about("Freeze a token account")
                .arg(
                    Arg::new("account")
                        .validator(is_valid_pubkey)
                        .value_name("TOKEN_ACCOUNT_ADDRESS")
                        .takes_value(true)
                        .index(1)
                        .required(true)
                        .help("The address of the token account to freeze"),
                )
                .arg(
                    Arg::new("freeze_authority")
                        .long("freeze-authority")
                        .alias("owner")
                        .value_name("KEYPAIR")
                        .validator(is_valid_signer)
                        .takes_value(true)
                        .help(
                            "Specify the freeze authority keypair. \
                             This may be a keypair file or the ASK keyword. \
                             Defaults to the client keypair."
                        ),
                )
                .arg(mint_address_arg())
                .arg(multisig_signer_arg())
                .nonce_args(true)
                .offline_args_config(&SignOnlyNeedsMintAddress{}),
        )
        .subcommand(
            Command::new(CommandName::Thaw.to_string())
                .about("Thaw a token account")
                .arg(
                    Arg::new("account")
                        .validator(is_valid_pubkey)
                        .value_name("TOKEN_ACCOUNT_ADDRESS")
                        .takes_value(true)
                        .index(1)
                        .required(true)
                        .help("The address of the token account to thaw"),
                )
                .arg(
                    Arg::new("freeze_authority")
                        .long("freeze-authority")
                        .alias("owner")
                        .value_name("KEYPAIR")
                        .validator(is_valid_signer)
                        .takes_value(true)
                        .help(
                            "Specify the freeze authority keypair. \
                             This may be a keypair file or the ASK keyword. \
                             Defaults to the client keypair."
                        ),
                )
                .arg(mint_address_arg())
                .arg(multisig_signer_arg())
                .nonce_args(true)
                .offline_args_config(&SignOnlyNeedsMintAddress{}),
        )
        .subcommand(
            Command::new(CommandName::Wrap.to_string())
                .about("Wrap native SOL in a SOL token account")
                .arg(
                    Arg::new("amount")
                        .validator(is_amount)
                        .value_name("AMOUNT")
                        .takes_value(true)
                        .index(1)
                        .required(true)
                        .help("Amount of SOL to wrap"),
                )
                .arg(
                    Arg::new("wallet_keypair")
                        .alias("owner")
                        .value_name("KEYPAIR")
                        .validator(is_valid_signer)
                        .takes_value(true)
                        .help(
                            "Specify the keypair for the wallet which will have its native SOL wrapped. \
                             This wallet will be assigned as the owner of the wrapped SOL token account. \
                             This may be a keypair file or the ASK keyword. \
                             Defaults to the client keypair."
                        ),
                )
                .arg(
                    Arg::new("create_aux_account")
                        .takes_value(false)
                        .long("create-aux-account")
                        .help("Wrap SOL in an auxiliary account instead of associated token account"),
                )
                .nonce_args(true)
                .offline_args(),
        )
        .subcommand(
            Command::new(CommandName::Unwrap.to_string())
                .about("Unwrap a SOL token account")
                .arg(
                    Arg::new("address")
                        .validator(is_valid_pubkey)
                        .value_name("TOKEN_ACCOUNT_ADDRESS")
                        .takes_value(true)
                        .index(1)
                        .help("The address of the auxiliary token account to unwrap \
                            [default: associated token account for --owner]"),
                )
                .arg(
                    Arg::new("wallet_keypair")
                        .alias("owner")
                        .value_name("KEYPAIR")
                        .validator(is_valid_signer)
                        .takes_value(true)
                        .help(
                            "Specify the keypair for the wallet which owns the wrapped SOL. \
                             This wallet will receive the unwrapped SOL. \
                             This may be a keypair file or the ASK keyword. \
                             Defaults to the client keypair."
                        ),
                )
                .arg(multisig_signer_arg())
                .nonce_args(true)
                .offline_args(),
        )
        .subcommand(
            Command::new(CommandName::Approve.to_string())
                .about("Approve a delegate for a token account")
                .arg(
                    Arg::new("account")
                        .validator(is_valid_pubkey)
                        .value_name("TOKEN_ACCOUNT_ADDRESS")
                        .takes_value(true)
                        .index(1)
                        .required(true)
                        .help("The address of the token account to delegate"),
                )
                .arg(
                    Arg::new("amount")
                        .validator(is_amount)
                        .value_name("TOKEN_AMOUNT")
                        .takes_value(true)
                        .index(2)
                        .required(true)
                        .help("Amount to approve, in tokens"),
                )
                .arg(
                    Arg::new("delegate")
                        .validator(is_valid_pubkey)
                        .value_name("DELEGATE_TOKEN_ACCOUNT_ADDRESS")
                        .takes_value(true)
                        .index(3)
                        .required(true)
                        .help("The token account address of delegate"),
                )
                .arg(
                    owner_keypair_arg()
                )
                .arg(multisig_signer_arg())
                .mint_args()
                .nonce_args(true)
                 .offline_args_config(&SignOnlyNeedsFullMintSpec{}),
        )
        .subcommand(
            Command::new(CommandName::Revoke.to_string())
                .about("Revoke a delegate's authority")
                .arg(
                    Arg::new("account")
                        .validator(is_valid_pubkey)
                        .value_name("TOKEN_ACCOUNT_ADDRESS")
                        .takes_value(true)
                        .index(1)
                        .required(true)
                        .help("The address of the token account"),
                )
                .arg(owner_keypair_arg()
                )
                .arg(delegate_address_arg())
                .arg(multisig_signer_arg())
                .nonce_args(true)
                .offline_args_config(&SignOnlyNeedsDelegateAddress{}),
        )
        .subcommand(
            Command::new(CommandName::Close.to_string())
                .about("Close a token account")
                .arg(
                    Arg::new("token")
                        .validator(is_valid_pubkey)
                        .value_name("TOKEN_ADDRESS")
                        .takes_value(true)
                        .index(1)
                        .required_unless_present("address")
                        .help("Token to close. To close a specific account, use the `--address` parameter instead"),
                )
                .arg(owner_address_arg())
                .arg(
                    Arg::new("recipient")
                        .long("recipient")
                        .validator(is_valid_pubkey)
                        .value_name("REFUND_ACCOUNT_ADDRESS")
                        .takes_value(true)
                        .help("The address of the account to receive remaining SOL [default: --owner]"),
                )
                .arg(
                    Arg::new("close_authority")
                        .long("close-authority")
                        .alias("owner")
                        .value_name("KEYPAIR")
                        .validator(is_valid_signer)
                        .takes_value(true)
                        .help(
                            "Specify the token's close authority if it has one, \
                            otherwise specify the token's owner keypair. \
                            This may be a keypair file, the ASK keyword. \
                            Defaults to the client keypair.",
                        ),
                )
                .arg(
                    Arg::new("address")
                        .long("address")
                        .validator(is_valid_pubkey)
                        .value_name("TOKEN_ACCOUNT_ADDRESS")
                        .takes_value(true)
                        .conflicts_with("token")
                        .help("Specify the token account to close \
                            [default: owner's associated token account]"),
                )
                .arg(multisig_signer_arg())
                .nonce_args(true)
                .offline_args(),
        )
        .subcommand(
            Command::new(CommandName::Balance.to_string())
                .about("Get token account balance")
                .arg(
                    Arg::new("token")
                        .validator(is_valid_pubkey)
                        .value_name("TOKEN_ADDRESS")
                        .takes_value(true)
                        .index(1)
                        .required_unless_present("address")
                        .help("Token of associated account. To query a specific account, use the `--address` parameter instead"),
                )
                .arg(owner_address_arg().conflicts_with("address"))
                .arg(
                    Arg::new("address")
                        .validator(is_valid_pubkey)
                        .value_name("TOKEN_ACCOUNT_ADDRESS")
                        .takes_value(true)
                        .long("address")
                        .conflicts_with("token")
                        .help("Specify the token account to query \
                            [default: owner's associated token account]"),
                ),
        )
        .subcommand(
            Command::new(CommandName::Supply.to_string())
                .about("Get token supply")
                .arg(
                    Arg::new("address")
                        .validator(is_valid_pubkey)
                        .value_name("TOKEN_ADDRESS")
                        .takes_value(true)
                        .index(1)
                        .required(true)
                        .help("The token address"),
                ),
        )
        .subcommand(
            Command::new(CommandName::Accounts.to_string())
                .about("List all token accounts by owner")
                .arg(
                    Arg::new("token")
                        .validator(is_valid_pubkey)
                        .value_name("TOKEN_ADDRESS")
                        .takes_value(true)
                        .index(1)
                        .help("Limit results to the given token. [Default: list accounts for all tokens]"),
                )
                .arg(owner_address_arg())
        )
        .subcommand(
            Command::new(CommandName::Address.to_string())
                .about("Get wallet address")
                .arg(
                    Arg::new("token")
                        .validator(is_valid_pubkey)
                        .value_name("TOKEN_ADDRESS")
                        .takes_value(true)
                        .long("token")
                        .requires("verbose")
                        .help("Return the associated token address for the given token. \
                               [Default: return the client keypair address]")
                )
                .arg(
                    owner_address_arg()
                        .requires("token")
                        .help("Return the associated token address for the given owner. \
                               [Default: return the associated token address for the client keypair]"),
                ),
        )
            .subcommand(
                Command::new(CommandName::AccountInfo.to_string())
                    .about("Query details of an SPL Token account by address")
                    .arg(
                        Arg::new("token")
                            .validator(is_valid_pubkey)
                            .value_name("TOKEN_ADDRESS")
                            .takes_value(true)
                            .index(1)
                            .conflicts_with("address")
                            .required_unless_present("address")
                            .help("Token of associated account. \
                                   To query a specific account, use the `--address` parameter instead"),
                    )
                    .arg(
                        owner_address_arg()
                            .index(2)
                            .conflicts_with("address")
                            .help("Owner of the associated account for the specified token. \
                                   To query a specific account, use the `--address` parameter instead. \
                                   Defaults to the client keypair."),
                    )
                    .arg(
                        Arg::new("address")
                            .validator(is_valid_pubkey)
                            .value_name("TOKEN_ACCOUNT_ADDRESS")
                            .takes_value(true)
                            .long("address")
                            .conflicts_with("token")
                            .help("Specify the token account to query"),
                    ),
            )
            .subcommand(
                Command::new(CommandName::MultisigInfo.to_string())
                    .about("Query details about and SPL Token multisig account by address")
                    .arg(
                        Arg::new("address")
                        .validator(is_valid_pubkey)
                        .value_name("MULTISIG_ACCOUNT_ADDRESS")
                        .takes_value(true)
                        .index(1)
                        .required(true)
                        .help("The address of the SPL Token multisig account to query"),
                    ),
            )
            .subcommand(
                Command::new(CommandName::Gc.to_string())
                    .about("Cleanup unnecessary token accounts")
                    .arg(owner_keypair_arg())
                    .arg(
                        Arg::new("close_empty_associated_accounts")
                        .long("close-empty-associated-accounts")
                        .takes_value(false)
                        .help("close all empty associated token accounts (to get SOL back)")
                    )
            )
            .subcommand(
                Command::new(CommandName::SyncNative.to_string())
                    .about("Sync a native SOL token account to its underlying lamports")
                    .arg(
                        owner_address_arg()
                            .index(1)
                            .conflicts_with("address")
                            .help("Owner of the associated account for the native token. \
                                   To query a specific account, use the `--address` parameter instead. \
                                   Defaults to the client keypair."),
                    )
                    .arg(
                        Arg::new("address")
                            .validator(is_valid_pubkey)
                            .value_name("TOKEN_ACCOUNT_ADDRESS")
                            .takes_value(true)
                            .long("address")
                            .conflicts_with("owner")
                            .help("Specify the specific token account address to sync"),
                    ),
            )
}
