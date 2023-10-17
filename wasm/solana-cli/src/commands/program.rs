use std::{mem::size_of, rc::Rc, str::FromStr};

use clap::{Arg, ArgMatches, Command};
use solana_clap_v3_utils_wasm::{
    input_parsers::{pubkey_of, pubkey_of_signer, signer_of},
    input_validators::is_valid_signer,
    keypair::{generate_unique_signers, SignerIndex},
};
use solana_cli_output_wasm::cli_output::{
    CliProgram, CliProgramAccountType, CliProgramAuthority, CliUpgradeableBuffer,
    CliUpgradeableBuffers, CliUpgradeableProgram, CliUpgradeableProgramClosed,
    CliUpgradeablePrograms,
};
use solana_client_wasm::{
    utils::{
        rpc_config::{RpcAccountInfoConfig, RpcProgramAccountsConfig, RpcSendTransactionConfig},
        rpc_filter::{Memcmp, MemcmpEncodedBytes, RpcFilterType},
    },
    WasmClient,
};
use solana_extra_wasm::account_decoder::{UiAccountEncoding, UiDataSliceConfig};
use solana_remote_wallet::remote_wallet::RemoteWalletManager;
use solana_sdk::{
    account::Account,
    account_utils::StateMut,
    bpf_loader, bpf_loader_deprecated,
    bpf_loader_upgradeable::{self, UpgradeableLoaderState},
    message::Message,
    pubkey::Pubkey,
    signature::Signer,
    transaction::Transaction,
};

use crate::cli::{CliCommand, CliCommandInfo, CliConfig, CliError, ProcessResult};

#[derive(Debug, PartialEq, Eq)]
pub enum ProgramCliCommand {
    //     Deploy {
    //         program_location: Option<String>,
    //         program_signer_index: Option<SignerIndex>,
    //         program_pubkey: Option<Pubkey>,
    //         buffer_signer_index: Option<SignerIndex>,
    //         buffer_pubkey: Option<Pubkey>,
    //         upgrade_authority_signer_index: SignerIndex,
    //         is_final: bool,
    //         max_len: Option<usize>,
    //         allow_excessive_balance: bool,
    //         skip_fee_check: bool,
    //     },
    //     WriteBuffer {
    //         program_location: String,
    //         buffer_signer_index: Option<SignerIndex>,
    //         buffer_pubkey: Option<Pubkey>,
    //         buffer_authority_signer_index: Option<SignerIndex>,
    //         max_len: Option<usize>,
    //         skip_fee_check: bool,
    //     },
    SetBufferAuthority {
        buffer_pubkey: Pubkey,
        buffer_authority_index: Option<SignerIndex>,
        new_buffer_authority: Pubkey,
    },
    SetUpgradeAuthority {
        program_pubkey: Pubkey,
        upgrade_authority_index: Option<SignerIndex>,
        new_upgrade_authority: Option<Pubkey>,
    },
    Show {
        account_pubkey: Option<Pubkey>,
        authority_pubkey: Pubkey,
        get_programs: bool,
        get_buffers: bool,
        all: bool,
        use_lamports_unit: bool,
    },
    //     Dump {
    //         account_pubkey: Option<Pubkey>,
    //         output_location: String,
    //     },
    Close {
        account_pubkey: Option<Pubkey>,
        recipient_pubkey: Pubkey,
        authority_index: SignerIndex,
        use_lamports_unit: bool,
    },
}

pub trait ProgramSubCommands {
    fn program_subcommands(self) -> Self;
}

impl ProgramSubCommands for Command<'_> {
    fn program_subcommands(self) -> Self {
        self.subcommand(
            Command::new("program")
                .about("Program management")
                .subcommand_required(true)
                .arg_required_else_help(true)
                .arg(
                    Arg::new("skip_fee_check")
                        .long("skip-fee-check")
                        .hide(true)
                        .takes_value(false)
                        .global(true),
                )
                //                 .subcommand(
                //                     Command::new("deploy")
                //                         .about("Deploy a program")
                //                         .arg(
                //                             Arg::new("program_location")
                //                                 .index(1)
                //                                 .value_name("PROGRAM_FILEPATH")
                //                                 .takes_value(true)
                //                                 .help("/path/to/program.so"),
                //                         )
                //                         .arg(
                //                             Arg::new("buffer")
                //                                 .long("buffer")
                //                                 .value_name("BUFFER_SIGNER")
                //                                 .takes_value(true)
                //                                 .validator(is_valid_signer)
                //                                 .help("Intermediate buffer account to write data to, which can be used to resume a failed deploy \
                //                                       [default: random address]")
                //                         )
                //                         .arg(
                //                             Arg::new("upgrade_authority")
                //                                 .long("upgrade-authority")
                //                                 .value_name("UPGRADE_AUTHORITY_SIGNER")
                //                                 .takes_value(true)
                //                                 .validator(is_valid_signer)
                //                                 .help("Upgrade authority [default: the default configured keypair]")
                //                         )
                //                         .arg(
                //                             pubkey!(Arg::new("program_id")
                //                                 .long("program-id")
                //                                 .value_name("PROGRAM_ID"),
                //                                 "Executable program's address, must be a keypair for initial deploys, can be a pubkey for upgrades \
                //                                 [default: address of keypair at /path/to/program-keypair.json if present, otherwise a random address]"),
                //                         )
                //                         .arg(
                //                             Arg::new("final")
                //                                 .long("final")
                //                                 .help("The program will not be upgradeable")
                //                         )
                //                         .arg(
                //                             Arg::new("max_len")
                //                                 .long("max-len")
                //                                 .value_name("max_len")
                //                                 .takes_value(true)
                //                                 .required(false)
                //                                 .help("Maximum length of the upgradeable program \
                //                                       [default: twice the length of the original deployed program]")
                //                         )
                //                         .arg(
                //                             Arg::new("allow_excessive_balance")
                //                                 .long("allow-excessive-deploy-account-balance")
                //                                 .takes_value(false)
                //                                 .help("Use the designated program id even if the account already holds a large balance of SOL")
                //                         ),
                //                 )
                //                 .subcommand(
                //                     Command::new("write-buffer")
                //                         .about("Writes a program into a buffer account")
                //                         .arg(
                //                             Arg::new("program_location")
                //                                 .index(1)
                //                                 .value_name("PROGRAM_FILEPATH")
                //                                 .takes_value(true)
                //                                 .required(true)
                //                                 .help("/path/to/program.so"),
                //                         )
                //                         .arg(
                //                             Arg::new("buffer")
                //                                 .long("buffer")
                //                                 .value_name("BUFFER_SIGNER")
                //                                 .takes_value(true)
                //                                 .validator(is_valid_signer)
                //                                 .help("Buffer account to write data into [default: random address]")
                //                         )
                //                         .arg(
                //                             Arg::new("buffer_authority")
                //                                 .long("buffer-authority")
                //                                 .value_name("BUFFER_AUTHORITY_SIGNER")
                //                                 .takes_value(true)
                //                                 .validator(is_valid_signer)
                //                                 .help("Buffer authority [default: the default configured keypair]")
                //                         )
                //                         .arg(
                //                             Arg::new("max_len")
                //                                 .long("max-len")
                //                                 .value_name("max_len")
                //                                 .takes_value(true)
                //                                 .required(false)
                //                                 .help("Maximum length of the upgradeable program \
                //                                       [default: twice the length of the original deployed program]")
                //                         ),
                //                 )
                                .subcommand(
                                    Command::new("set-buffer-authority")
                                        .about("Set a new buffer authority")
                                        .arg(
                                            Arg::new("buffer")
                                                .index(1)
                                                .value_name("BUFFER_PUBKEY")
                                                .takes_value(true)
                                                .required(true)
                                                .help("Public key of the buffer")
                                        )
                                        .arg(
                                            Arg::new("buffer_authority")
                                                .long("buffer-authority")
                                                .value_name("BUFFER_AUTHORITY_SIGNER")
                                                .takes_value(true)
                                                .validator(is_valid_signer)
                                                .help("Buffer authority [default: the default configured keypair]")
                                        )
                                        .arg(
                                            pubkey!(Arg::new("new_buffer_authority")
                                                .long("new-buffer-authority")
                                                .value_name("NEW_BUFFER_AUTHORITY")
                                                .required(true),
                                                "Address of the new buffer authority"),
                                        )
                                )
                                .subcommand(
                                    Command::new("set-upgrade-authority")
                                        .about("Set a new program authority")
                                        .arg(
                                            Arg::new("program_id")
                                                .index(1)
                                                .value_name("PROGRAM_ADDRESS")
                                                .takes_value(true)
                                                .required(true)
                                                .help("Address of the program to upgrade")
                                        )
                                        .arg(
                                            Arg::new("upgrade_authority")
                                                .long("upgrade-authority")
                                                .value_name("UPGRADE_AUTHORITY_SIGNER")
                                                .takes_value(true)
                                                .validator(is_valid_signer)
                                                .help("Upgrade authority [default: the default configured keypair]")
                                        )
                                        .arg(
                                            pubkey!(Arg::new("new_upgrade_authority")
                                                .long("new-upgrade-authority")
                                                .required_unless_present("final")
                                                .value_name("NEW_UPGRADE_AUTHORITY"),
                                                "Address of the new upgrade authority"),
                                        )
                                        .arg(
                                            Arg::new("final")
                                                .long("final")
                                                .conflicts_with("new_upgrade_authority")
                                                .help("The program will not be upgradeable")
                                        )
                                )
                .subcommand(
                    Command::new("show")
                        .about("Display information about a buffer or program")
                        .arg(
                            Arg::new("account")
                                .index(1)
                                .value_name("ACCOUNT_ADDRESS")
                                .takes_value(true)
                                .help("Address of the buffer or program to show"),
                        )
                        .arg(
                            Arg::new("programs")
                                .long("programs")
                                .conflicts_with("account")
                                .conflicts_with("buffers")
                                .required_unless_present_any(["account", "buffers"])
                                .help("Show every upgradeable program that matches the authority"),
                        )
                        .arg(
                            Arg::new("buffers")
                                .long("buffers")
                                .conflicts_with("account")
                                .conflicts_with("programs")
                                .required_unless_present_any(["account", "programs"])
                                .help("Show every upgradeable buffer that matches the authority"),
                        )
                        .arg(
                            Arg::new("all")
                                .long("all")
                                .conflicts_with("account")
                                .conflicts_with("buffer_authority")
                                .help("Show accounts for all authorities"),
                        )
                        .arg(pubkey!(
                            Arg::new("buffer_authority")
                                .long("buffer-authority")
                                .value_name("AUTHORITY")
                                .conflicts_with("all"),
                            "Authority [default: the default configured keypair]"
                        ))
                        .arg(
                            Arg::new("lamports")
                                .long("lamports")
                                .takes_value(false)
                                .help("Display balance in lamports instead of SOL"),
                        ),
                ) //                 .subcommand(
                   //                     Command::new("dump")
                   //                         .about("Write the program data to a file")
                   //                         .arg(
                   //                             Arg::new("account")
                   //                                 .index(1)
                   //                                 .value_name("ACCOUNT_ADDRESS")
                   //                                 .takes_value(true)
                   //                                 .required(true)
                   //                                 .help("Address of the buffer or program")
                   //                         )
                   //                         .arg(
                   //                             Arg::new("output_location")
                   //                                 .index(2)
                   //                                 .value_name("OUTPUT_FILEPATH")
                   //                                 .takes_value(true)
                   //                                 .required(true)
                   //                                 .help("/path/to/program.so"),
                   //                         ),
                   //                 )
                                   .subcommand(
                                       Command::new("close")
                                           .about("Close a program or buffer account and withdraw all lamports")
                                           .arg(
                                               Arg::new("account")
                                                   .index(1)
                                                   .value_name("ACCOUNT_ADDRESS")
                                                   .takes_value(true)
                                                   .help("Address of the program or buffer account to close"),
                                           )
                                           .arg(
                                               Arg::new("buffers")
                                                   .long("buffers")
                                                   .conflicts_with("account")
                                                   .required_unless_present("account")
                                                   .help("Close all buffer accounts that match the authority")
                                           )
                                           .arg(
                                               Arg::new("authority")
                                                   .long("authority")
                                                   .alias("buffer-authority")
                                                   .value_name("AUTHORITY_SIGNER")
                                                   .takes_value(true)
                                                   .validator(is_valid_signer)
                                                   .help("Upgrade or buffer authority [default: the default configured keypair]")
                                           )

                                           .arg(
                                               pubkey!(Arg::new("recipient_account")
                                                   .long("recipient")
                                                   .value_name("RECIPIENT_ADDRESS"),
                                                   "Address of the account to deposit the closed account's lamports [default: the default configured keypair]"),
                                           )
                                           .arg(
                                               Arg::new("lamports")
                                                   .long("lamports")
                                                   .takes_value(false)
                                                   .help("Display balance in lamports instead of SOL"),
                                           ),
                           )
                   //         .subcommand(
                   //             Command::new("deploy")
                   //                 .about("Deploy a program")
                   //                 .setting(AppSettings::Hidden)
                   //                 .arg(
                   //                     Arg::new("program_location")
                   //                         .index(1)
                   //                         .value_name("PROGRAM_FILEPATH")
                   //                         .takes_value(true)
                   //                         .required(true)
                   //                         .help("/path/to/program.o"),
                   //                 )
                   //                 .arg(
                   //                     Arg::new("address_signer")
                   //                         .index(2)
                   //                         .value_name("PROGRAM_ADDRESS_SIGNER")
                   //                         .takes_value(true)
                   //                         .validator(is_valid_signer)
                   //                         .help("The signer for the desired address of the program [default: new random address]")
                   //                 )
                   //                 .arg(
                   //                     Arg::new("use_deprecated_loader")
                   //                         .long("use-deprecated-loader")
                   //                         .takes_value(false)
                   //                         .hide(true) // Don't document this argument to discourage its use
                   //                         .help("Use the deprecated BPF loader")
                   //                 )
                   //                 .arg(
                   //                     Arg::new("allow_excessive_balance")
                   //                         .long("allow-excessive-deploy-account-balance")
                   //                         .takes_value(false)
                   //                         .help("Use the designated program id, even if the account already holds a large balance of SOL")
                   //                 )
                   //                 .arg(
                   //                     Arg::new("skip_fee_check")
                   //                         .long("skip-fee-check")
                   //                         .hide(true)
                   //                         .takes_value(false)
                   //                 ),
        )
    }
}

pub fn parse_program_subcommand(
    matches: &ArgMatches,
    default_signer: Box<dyn Signer>,
    wallet_manager: &mut Option<Rc<RemoteWalletManager>>,
) -> Result<CliCommandInfo, CliError> {
    let (subcommand, sub_matches) = matches.subcommand().unwrap();
    let matches_skip_fee_check = matches.is_present("skip_fee_check");
    let sub_matches_skip_fee_check = sub_matches.is_present("skip_fee_check");
    let _skip_fee_check = matches_skip_fee_check || sub_matches_skip_fee_check;

    let response = match (subcommand, sub_matches) {
        //         ("deploy", Some(matches)) => {
        //             let mut bulk_signers = vec![Some(
        //                 default_signer.signer_from_path(matches, wallet_manager)?,
        //             )];

        //             let program_location = matches
        //                 .value_of("program_location")
        //                 .map(|location| location.to_string());

        //             let buffer_pubkey = if let Ok((buffer_signer, Some(buffer_pubkey))) =
        //                 signer_of(matches, "buffer", wallet_manager)
        //             {
        //                 bulk_signers.push(buffer_signer);
        //                 Some(buffer_pubkey)
        //             } else {
        //                 pubkey_of_signer(matches, "buffer", wallet_manager)?
        //             };

        //             let program_pubkey = if let Ok((program_signer, Some(program_pubkey))) =
        //                 signer_of(matches, "program_id", wallet_manager)
        //             {
        //                 bulk_signers.push(program_signer);
        //                 Some(program_pubkey)
        //             } else {
        //                 pubkey_of_signer(matches, "program_id", wallet_manager)?
        //             };

        //             let upgrade_authority_pubkey =
        //                 if let Ok((upgrade_authority_signer, Some(upgrade_authority_pubkey))) =
        //                     signer_of(matches, "upgrade_authority", wallet_manager)
        //                 {
        //                     bulk_signers.push(upgrade_authority_signer);
        //                     Some(upgrade_authority_pubkey)
        //                 } else {
        //                     Some(
        //                         default_signer
        //                             .signer_from_path(matches, wallet_manager)?
        //                             .pubkey(),
        //                     )
        //                 };

        //             let max_len = value_of(matches, "max_len");

        //             let signer_info =
        //                 default_signer.generate_unique_signers(bulk_signers, matches, wallet_manager)?;

        //             CliCommandInfo {
        //                 command: CliCommand::Program(ProgramCliCommand::Deploy {
        //                     program_location,
        //                     program_signer_index: signer_info.index_of_or_none(program_pubkey),
        //                     program_pubkey,
        //                     buffer_signer_index: signer_info.index_of_or_none(buffer_pubkey),
        //                     buffer_pubkey,
        //                     upgrade_authority_signer_index: signer_info
        //                         .index_of(upgrade_authority_pubkey)
        //                         .unwrap(),
        //                     is_final: matches.is_present("final"),
        //                     max_len,
        //                     allow_excessive_balance: matches.is_present("allow_excessive_balance"),
        //                     skip_fee_check,
        //                 }),
        //                 signers: signer_info.signers,
        //             }
        //         }
        //         ("write-buffer", Some(matches)) => {
        //             let mut bulk_signers = vec![Some(
        //                 default_signer.signer_from_path(matches, wallet_manager)?,
        //             )];

        //             let buffer_pubkey = if let Ok((buffer_signer, Some(buffer_pubkey))) =
        //                 signer_of(matches, "buffer", wallet_manager)
        //             {
        //                 bulk_signers.push(buffer_signer);
        //                 Some(buffer_pubkey)
        //             } else {
        //                 pubkey_of_signer(matches, "buffer", wallet_manager)?
        //             };

        //             let buffer_authority_pubkey =
        //                 if let Ok((buffer_authority_signer, Some(buffer_authority_pubkey))) =
        //                     signer_of(matches, "buffer_authority", wallet_manager)
        //                 {
        //                     bulk_signers.push(buffer_authority_signer);
        //                     Some(buffer_authority_pubkey)
        //                 } else {
        //                     Some(
        //                         default_signer
        //                             .signer_from_path(matches, wallet_manager)?
        //                             .pubkey(),
        //                     )
        //                 };

        //             let max_len = value_of(matches, "max_len");

        //             let signer_info =
        //                 default_signer.generate_unique_signers(bulk_signers, matches, wallet_manager)?;

        //             CliCommandInfo {
        //                 command: CliCommand::Program(ProgramCliCommand::WriteBuffer {
        //                     program_location: matches.value_of("program_location").unwrap().to_string(),
        //                     buffer_signer_index: signer_info.index_of_or_none(buffer_pubkey),
        //                     buffer_pubkey,
        //                     buffer_authority_signer_index: signer_info
        //                         .index_of_or_none(buffer_authority_pubkey),
        //                     max_len,
        //                     skip_fee_check,
        //                 }),
        //                 signers: signer_info.signers,
        //             }
        //         }
        ("set-buffer-authority", matches) => {
            let buffer_pubkey = pubkey_of(matches, "buffer").unwrap();

            let (buffer_authority_signer, buffer_authority_pubkey) =
                signer_of(matches, "buffer_authority", wallet_manager)?;
            let new_buffer_authority =
                pubkey_of_signer(matches, "new_buffer_authority", wallet_manager)?.unwrap();

            let signer_info =
                generate_unique_signers(default_signer, vec![buffer_authority_signer])?;

            CliCommandInfo {
                command: CliCommand::Program(ProgramCliCommand::SetBufferAuthority {
                    buffer_pubkey,
                    buffer_authority_index: signer_info.index_of(buffer_authority_pubkey),
                    new_buffer_authority,
                }),
                signers: signer_info.signers,
            }
        }
        ("set-upgrade-authority", matches) => {
            let (upgrade_authority_signer, upgrade_authority_pubkey) =
                signer_of(matches, "upgrade_authority", wallet_manager)?;
            let program_pubkey = pubkey_of(matches, "program_id").unwrap();
            let new_upgrade_authority = if matches.is_present("final") {
                None
            } else {
                pubkey_of_signer(matches, "new_upgrade_authority", wallet_manager)?
            };

            let signer_info =
                generate_unique_signers(default_signer, vec![upgrade_authority_signer])?;

            CliCommandInfo {
                command: CliCommand::Program(ProgramCliCommand::SetUpgradeAuthority {
                    program_pubkey,
                    upgrade_authority_index: signer_info.index_of(upgrade_authority_pubkey),
                    new_upgrade_authority,
                }),
                signers: signer_info.signers,
            }
        }
        ("show", matches) => {
            let authority_pubkey = if let Some(authority_pubkey) =
                pubkey_of_signer(matches, "buffer_authority", wallet_manager)?
            {
                authority_pubkey
            } else {
                default_signer.pubkey()
            };

            CliCommandInfo {
                command: CliCommand::Program(ProgramCliCommand::Show {
                    account_pubkey: pubkey_of(matches, "account"),
                    authority_pubkey,
                    get_programs: matches.is_present("programs"),
                    get_buffers: matches.is_present("buffers"),
                    all: matches.is_present("all"),
                    use_lamports_unit: matches.is_present("lamports"),
                }),
                signers: vec![],
            }
        }
        //         ("dump", Some(matches)) => CliCommandInfo {
        //             command: CliCommand::Program(ProgramCliCommand::Dump {
        //                 account_pubkey: pubkey_of(matches, "account"),
        //                 output_location: matches.value_of("output_location").unwrap().to_string(),
        //             }),
        //             signers: vec![],
        //         },
        ("close", matches) => {
            let account_pubkey = if matches.is_present("buffers") {
                None
            } else {
                pubkey_of(matches, "account")
            };

            let recipient_pubkey = if let Some(recipient_pubkey) =
                pubkey_of_signer(matches, "recipient_account", wallet_manager)?
            {
                recipient_pubkey
            } else {
                default_signer.pubkey()
            };

            let (authority_signer, authority_pubkey) =
                signer_of(matches, "authority", wallet_manager)?;

            let signer_info = generate_unique_signers(default_signer, vec![authority_signer])?;

            CliCommandInfo {
                command: CliCommand::Program(ProgramCliCommand::Close {
                    account_pubkey,
                    recipient_pubkey,
                    authority_index: signer_info.index_of(authority_pubkey).unwrap(),
                    use_lamports_unit: matches.is_present("lamports"),
                }),
                signers: signer_info.signers,
            }
        }
        _ => unreachable!(),
    };
    Ok(response)
}

pub async fn process_program_subcommand(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    program_subcommand: &ProgramCliCommand,
) -> ProcessResult {
    match program_subcommand {
        //         ProgramCliCommand::Deploy {
        //             program_location,
        //             program_signer_index,
        //             program_pubkey,
        //             buffer_signer_index,
        //             buffer_pubkey,
        //             upgrade_authority_signer_index,
        //             is_final,
        //             max_len,
        //             allow_excessive_balance,
        //             skip_fee_check,
        //         } => process_program_deploy(
        //             rpc_client,
        //             config,
        //             program_location,
        //             *program_signer_index,
        //             *program_pubkey,
        //             *buffer_signer_index,
        //             *buffer_pubkey,
        //             *upgrade_authority_signer_index,
        //             *is_final,
        //             *max_len,
        //             *allow_excessive_balance,
        //             *skip_fee_check,
        //         ),
        //         ProgramCliCommand::WriteBuffer {
        //             program_location,
        //             buffer_signer_index,
        //             buffer_pubkey,
        //             buffer_authority_signer_index,
        //             max_len,
        //             skip_fee_check,
        //         } => process_write_buffer(
        //             rpc_client,
        //             config,
        //             program_location,
        //             *buffer_signer_index,
        //             *buffer_pubkey,
        //             *buffer_authority_signer_index,
        //             *max_len,
        //             *skip_fee_check,
        //         ),
        ProgramCliCommand::SetBufferAuthority {
            buffer_pubkey,
            buffer_authority_index,
            new_buffer_authority,
        } => {
            process_set_authority(
                rpc_client,
                config,
                None,
                Some(*buffer_pubkey),
                *buffer_authority_index,
                Some(*new_buffer_authority),
            )
            .await
        }
        ProgramCliCommand::SetUpgradeAuthority {
            program_pubkey,
            upgrade_authority_index,
            new_upgrade_authority,
        } => {
            process_set_authority(
                rpc_client,
                config,
                Some(*program_pubkey),
                None,
                *upgrade_authority_index,
                *new_upgrade_authority,
            )
            .await
        }
        ProgramCliCommand::Show {
            account_pubkey,
            authority_pubkey,
            get_programs,
            get_buffers,
            all,
            use_lamports_unit,
        } => {
            process_show(
                rpc_client,
                config,
                *account_pubkey,
                *authority_pubkey,
                *get_programs,
                *get_buffers,
                *all,
                *use_lamports_unit,
            )
            .await
        }
        //         ProgramCliCommand::Dump {
        //             account_pubkey,
        //             output_location,
        //         } => process_dump(&rpc_client, config, *account_pubkey, output_location),
        ProgramCliCommand::Close {
            account_pubkey,
            recipient_pubkey,
            authority_index,
            use_lamports_unit,
        } => {
            process_close(
                rpc_client,
                config,
                *account_pubkey,
                *recipient_pubkey,
                *authority_index,
                *use_lamports_unit,
            )
            .await
        }
    }
}

// fn get_default_program_keypair(program_location: &Option<String>) -> Keypair {
//     let program_keypair = {
//         if let Some(program_location) = program_location {
//             let mut keypair_file = PathBuf::new();
//             keypair_file.push(program_location);
//             let mut filename = keypair_file.file_stem().unwrap().to_os_string();
//             filename.push("-keypair");
//             keypair_file.set_file_name(filename);
//             keypair_file.set_extension("json");
//             if let Ok(keypair) = read_keypair_file(&keypair_file.to_str().unwrap()) {
//                 keypair
//             } else {
//                 Keypair::new()
//             }
//         } else {
//             Keypair::new()
//         }
//     };
//     program_keypair
// }

// /// Deploy using upgradeable loader
// #[allow(clippy::too_many_arguments)]
// fn process_program_deploy(
//     rpc_client: Arc<WasmClient>,
//     config: &CliConfig<'_>,
//     program_location: &Option<String>,
//     program_signer_index: Option<SignerIndex>,
//     program_pubkey: Option<Pubkey>,
//     buffer_signer_index: Option<SignerIndex>,
//     buffer_pubkey: Option<Pubkey>,
//     upgrade_authority_signer_index: SignerIndex,
//     is_final: bool,
//     max_len: Option<usize>,
//     allow_excessive_balance: bool,
//     skip_fee_check: bool,
// ) -> ProcessResult {
//     let (words, mnemonic, buffer_keypair) = create_ephemeral_keypair()?;
//     let (buffer_provided, buffer_signer, buffer_pubkey) = if let Some(i) = buffer_signer_index {
//         (true, Some(config.signers[i]), config.signers[i].pubkey())
//     } else if let Some(pubkey) = buffer_pubkey {
//         (true, None, pubkey)
//     } else {
//         (
//             false,
//             Some(&buffer_keypair as &dyn Signer),
//             buffer_keypair.pubkey(),
//         )
//     };
//     let upgrade_authority_signer = config.signers[upgrade_authority_signer_index];

//     let default_program_keypair = get_default_program_keypair(program_location);
//     let (program_signer, program_pubkey) = if let Some(i) = program_signer_index {
//         (Some(config.signers[i]), config.signers[i].pubkey())
//     } else if let Some(program_pubkey) = program_pubkey {
//         (None, program_pubkey)
//     } else {
//         (
//             Some(&default_program_keypair as &dyn Signer),
//             default_program_keypair.pubkey(),
//         )
//     };

//     let do_deploy = if let Some(account) = rpc_client
//         .get_account_with_commitment(&program_pubkey, config.commitment_config)?
//         .value
//     {
//         if account.owner != bpf_loader_upgradeable::id() {
//             return Err(format!(
//                 "Account {} is not an upgradeable program or already in use",
//                 program_pubkey
//             )
//             .into());
//         }

//         if !account.executable {
//             // Continue an initial deploy
//             true
//         } else if let Ok(UpgradeableLoaderState::Program {
//             programdata_address,
//         }) = account.state()
//         {
//             if let Some(account) = rpc_client
//                 .get_account_with_commitment(&programdata_address, config.commitment_config)?
//                 .value
//             {
//                 if let Ok(UpgradeableLoaderState::ProgramData {
//                     slot: _,
//                     upgrade_authority_address: program_authority_pubkey,
//                 }) = account.state()
//                 {
//                     if program_authority_pubkey.is_none() {
//                         return Err(
//                             format!("Program {} is no longer upgradeable", program_pubkey).into(),
//                         );
//                     }
//                     if program_authority_pubkey != Some(upgrade_authority_signer.pubkey()) {
//                         return Err(format!(
//                             "Program's authority {:?} does not match authority provided {:?}",
//                             program_authority_pubkey,
//                             upgrade_authority_signer.pubkey(),
//                         )
//                         .into());
//                     }
//                     // Do upgrade
//                     false
//                 } else {
//                     return Err(format!(
//                         "Program {} has been closed, use a new Program Id",
//                         program_pubkey
//                     )
//                     .into());
//                 }
//             } else {
//                 return Err(format!(
//                     "Program {} has been closed, use a new Program Id",
//                     program_pubkey
//                 )
//                 .into());
//             }
//         } else {
//             return Err(format!("{} is not an upgradeable program", program_pubkey).into());
//         }
//     } else {
//         // do new deploy
//         true
//     };

//     let (program_data, program_len) = if let Some(program_location) = program_location {
//         let program_data = read_and_verify_elf(program_location)?;
//         let program_len = program_data.len();
//         (program_data, program_len)
//     } else if buffer_provided {
//         // Check supplied buffer account
//         if let Some(account) = rpc_client
//             .get_account_with_commitment(&buffer_pubkey, config.commitment_config)?
//             .value
//         {
//             if !bpf_loader_upgradeable::check_id(&account.owner) {
//                 return Err(format!(
//                     "Buffer account {buffer_pubkey} is not owned by the BPF Upgradeable Loader",
//                 )
//                 .into());
//             }

//             match account.state() {
//                 Ok(UpgradeableLoaderState::Buffer { .. }) => {
//                     // continue if buffer is initialized
//                 }
//                 Ok(UpgradeableLoaderState::Program { .. }) => {
//                     return Err(
//                         format!("Cannot use program account {buffer_pubkey} as buffer").into(),
//                     );
//                 }
//                 Ok(UpgradeableLoaderState::ProgramData { .. }) => {
//                     return Err(format!(
//                         "Cannot use program data account {buffer_pubkey} as buffer",
//                     )
//                     .into())
//                 }
//                 Ok(UpgradeableLoaderState::Uninitialized) => {
//                     return Err(format!("Buffer account {buffer_pubkey} is not initialized").into());
//                 }
//                 Err(_) => {
//                     return Err(
//                         format!("Buffer account {buffer_pubkey} could not be deserialized").into(),
//                     )
//                 }
//             };

//             let program_len = account
//                 .data
//                 .len()
//                 .saturating_sub(UpgradeableLoaderState::size_of_buffer_metadata());

//             (vec![], program_len)
//         } else {
//             return Err(format!(
//                 "Buffer account {buffer_pubkey} not found, was it already consumed?",
//             )
//             .into());
//         }
//     } else {
//         return Err("Program location required if buffer not supplied".into());
//     };
//     let programdata_len = if let Some(len) = max_len {
//         if program_len > len {
//             return Err("Max length specified not large enough".into());
//         }
//         len
//     } else if is_final {
//         program_len
//     } else {
//         program_len * 2
//     };
//     let minimum_balance = rpc_client.get_minimum_balance_for_rent_exemption(
//         UpgradeableLoaderState::size_of_programdata(program_len),
//     )?;

//     let result = if do_deploy {
//         if program_signer.is_none() {
//             return Err(
//                 "Initial deployments require a keypair be provided for the program id".into(),
//             );
//         }
//         do_process_program_write_and_deploy(
//             rpc_client.clone(),
//             config,
//             &program_data,
//             program_len,
//             programdata_len,
//             minimum_balance,
//             &bpf_loader_upgradeable::id(),
//             Some(&[program_signer.unwrap(), upgrade_authority_signer]),
//             buffer_signer,
//             &buffer_pubkey,
//             Some(upgrade_authority_signer),
//             allow_excessive_balance,
//             skip_fee_check,
//         )
//     } else {
//         do_process_program_upgrade(
//             rpc_client.clone(),
//             config,
//             &program_data,
//             &program_pubkey,
//             config.signers[upgrade_authority_signer_index],
//             &buffer_pubkey,
//             buffer_signer,
//             skip_fee_check,
//         )
//     };
//     if result.is_ok() && is_final {
//         process_set_authority(
//             &rpc_client,
//             config,
//             Some(program_pubkey),
//             None,
//             Some(upgrade_authority_signer_index),
//             None,
//         )?;
//     }
//     if result.is_err() && buffer_signer_index.is_none() {
//         report_ephemeral_mnemonic(words, mnemonic);
//     }
//     result
// }

// fn process_write_buffer(
//     rpc_client: Arc<WasmClient>,
//     config: &CliConfig<'_>,
//     program_location: &str,
//     buffer_signer_index: Option<SignerIndex>,
//     buffer_pubkey: Option<Pubkey>,
//     buffer_authority_signer_index: Option<SignerIndex>,
//     max_len: Option<usize>,
//     skip_fee_check: bool,
// ) -> ProcessResult {
//     // Create ephemeral keypair to use for Buffer account, if not provided
//     let (words, mnemonic, buffer_keypair) = create_ephemeral_keypair()?;
//     let (buffer_signer, buffer_pubkey) = if let Some(i) = buffer_signer_index {
//         (Some(config.signers[i]), config.signers[i].pubkey())
//     } else if let Some(pubkey) = buffer_pubkey {
//         (None, pubkey)
//     } else {
//         (
//             Some(&buffer_keypair as &dyn Signer),
//             buffer_keypair.pubkey(),
//         )
//     };
//     let buffer_authority = if let Some(i) = buffer_authority_signer_index {
//         config.signers[i]
//     } else {
//         config.signers[0]
//     };

//     if let Some(account) = rpc_client
//         .get_account_with_commitment(&buffer_pubkey, config.commitment_config)?
//         .value
//     {
//         if let Ok(UpgradeableLoaderState::Buffer { authority_address }) = account.state() {
//             if authority_address.is_none() {
//                 return Err(format!("Buffer {} is immutable", buffer_pubkey).into());
//             }
//             if authority_address != Some(buffer_authority.pubkey()) {
//                 return Err(format!(
//                     "Buffer's authority {:?} does not match authority provided {}",
//                     authority_address,
//                     buffer_authority.pubkey()
//                 )
//                 .into());
//             }
//         } else {
//             return Err(format!(
//                 "{} is not an upgradeable loader buffer account",
//                 buffer_pubkey
//             )
//             .into());
//         }
//     }

//     let program_data = read_and_verify_elf(program_location)?;
//     let buffer_data_len = if let Some(len) = max_len {
//         len
//     } else {
//         program_data.len()
//     };
//     let minimum_balance = rpc_client.get_minimum_balance_for_rent_exemption(
//         UpgradeableLoaderState::size_of_programdata(buffer_data_len),
//     )?;

//     let result = do_process_program_write_and_deploy(
//         rpc_client,
//         config,
//         &program_data,
//         program_data.len(),
//         program_data.len(),
//         minimum_balance,
//         &bpf_loader_upgradeable::id(),
//         None,
//         buffer_signer,
//         &buffer_pubkey,
//         Some(buffer_authority),
//         true,
//         skip_fee_check,
//     );

//     if result.is_err() && buffer_signer_index.is_none() && buffer_signer.is_some() {
//         report_ephemeral_mnemonic(words, mnemonic);
//     }
//     result
// }

async fn process_set_authority(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    program_pubkey: Option<Pubkey>,
    buffer_pubkey: Option<Pubkey>,
    authority: Option<SignerIndex>,
    new_authority: Option<Pubkey>,
) -> ProcessResult {
    let authority_signer = if let Some(index) = authority {
        config.signers[index]
    } else {
        return Err("Set authority requires the current authority".into());
    };

    let blockhash = rpc_client.get_latest_blockhash().await?;

    let mut tx = if let Some(ref pubkey) = program_pubkey {
        Transaction::new_unsigned(Message::new(
            &[bpf_loader_upgradeable::set_upgrade_authority(
                pubkey,
                &authority_signer.pubkey(),
                new_authority.as_ref(),
            )],
            Some(&config.signers[0].pubkey()),
        ))
    } else if let Some(pubkey) = buffer_pubkey {
        if let Some(ref new_authority) = new_authority {
            Transaction::new_unsigned(Message::new(
                &[bpf_loader_upgradeable::set_buffer_authority(
                    &pubkey,
                    &authority_signer.pubkey(),
                    new_authority,
                )],
                Some(&config.signers[0].pubkey()),
            ))
        } else {
            return Err("Buffer authority cannot be None".into());
        }
    } else {
        return Err("Program or Buffer not provided".into());
    };

    tx.try_sign(&[config.signers[0], authority_signer], blockhash)?;
    rpc_client
        .send_and_confirm_transaction_with_config(
            &tx,
            config.commitment_config,
            RpcSendTransactionConfig {
                skip_preflight: true,
                encoding: config.send_transaction_config.encoding,
                preflight_commitment: Some(config.commitment()),
                ..RpcSendTransactionConfig::default()
            },
        )
        .await
        .map_err(|e| format!("Setting authority failed: {}", e))?;

    let authority = CliProgramAuthority {
        authority: new_authority
            .map(|pubkey| pubkey.to_string())
            .unwrap_or_else(|| "none".to_string()),
        account_type: if program_pubkey.is_some() {
            CliProgramAccountType::Program
        } else {
            CliProgramAccountType::Buffer
        },
    };
    Ok(config.output_format.formatted_string(&authority))
}

const ACCOUNT_TYPE_SIZE: usize = 4;
const SLOT_SIZE: usize = size_of::<u64>();
const OPTION_SIZE: usize = 1;
const PUBKEY_LEN: usize = 32;

async fn get_buffers(
    rpc_client: &WasmClient,
    authority_pubkey: Option<Pubkey>,
    use_lamports_unit: bool,
) -> Result<CliUpgradeableBuffers, Box<dyn std::error::Error>> {
    let mut filters = vec![RpcFilterType::Memcmp(Memcmp {
        offset: 0,
        bytes: MemcmpEncodedBytes::Base58(bs58::encode(vec![1, 0, 0, 0]).into_string()),
        encoding: None,
    })];
    if let Some(authority_pubkey) = authority_pubkey {
        filters.push(RpcFilterType::Memcmp(Memcmp {
            offset: ACCOUNT_TYPE_SIZE,
            bytes: MemcmpEncodedBytes::Base58(bs58::encode(vec![1]).into_string()),
            encoding: None,
        }));
        filters.push(RpcFilterType::Memcmp(Memcmp {
            offset: ACCOUNT_TYPE_SIZE + OPTION_SIZE,
            bytes: MemcmpEncodedBytes::Base58(
                bs58::encode(authority_pubkey.as_ref()).into_string(),
            ),
            encoding: None,
        }));
    }

    let results = get_accounts_with_filter(
        rpc_client,
        filters,
        ACCOUNT_TYPE_SIZE + OPTION_SIZE + PUBKEY_LEN,
    )
    .await?;

    let mut buffers = vec![];
    for (address, account) in results.iter() {
        if let Ok(UpgradeableLoaderState::Buffer { authority_address }) = account.state() {
            buffers.push(CliUpgradeableBuffer {
                address: address.to_string(),
                authority: authority_address
                    .map(|pubkey| pubkey.to_string())
                    .unwrap_or_else(|| "none".to_string()),
                data_len: 0,
                lamports: account.lamports,
                use_lamports_unit,
            });
        } else {
            return Err(format!("Error parsing Buffer account {}", address).into());
        }
    }
    Ok(CliUpgradeableBuffers {
        buffers,
        use_lamports_unit,
    })
}

async fn get_programs(
    rpc_client: &WasmClient,
    authority_pubkey: Option<Pubkey>,
    use_lamports_unit: bool,
) -> Result<CliUpgradeablePrograms, Box<dyn std::error::Error>> {
    let mut filters = vec![RpcFilterType::Memcmp(Memcmp {
        offset: 0,
        bytes: MemcmpEncodedBytes::Base58(bs58::encode(vec![3, 0, 0, 0]).into_string()),
        encoding: None,
    })];
    if let Some(authority_pubkey) = authority_pubkey {
        filters.push(RpcFilterType::Memcmp(Memcmp {
            offset: ACCOUNT_TYPE_SIZE + SLOT_SIZE,
            bytes: MemcmpEncodedBytes::Base58(bs58::encode(vec![1]).into_string()),
            encoding: None,
        }));
        filters.push(RpcFilterType::Memcmp(Memcmp {
            offset: ACCOUNT_TYPE_SIZE + SLOT_SIZE + OPTION_SIZE,
            bytes: MemcmpEncodedBytes::Base58(
                bs58::encode(authority_pubkey.as_ref()).into_string(),
            ),
            encoding: None,
        }));
    }

    let results = get_accounts_with_filter(
        rpc_client,
        filters,
        ACCOUNT_TYPE_SIZE + SLOT_SIZE + OPTION_SIZE + PUBKEY_LEN,
    )
    .await?;

    let mut programs = vec![];
    for (programdata_address, programdata_account) in results.iter() {
        if let Ok(UpgradeableLoaderState::ProgramData {
            slot,
            upgrade_authority_address,
        }) = programdata_account.state()
        {
            let mut bytes = vec![2, 0, 0, 0];
            bytes.extend_from_slice(programdata_address.as_ref());
            let filters = vec![RpcFilterType::Memcmp(Memcmp {
                offset: 0,
                bytes: MemcmpEncodedBytes::Base58(bs58::encode(bytes).into_string()),
                encoding: None,
            })];

            let results = get_accounts_with_filter(rpc_client, filters, 0).await?;
            if results.len() != 1 {
                return Err(format!(
                    "Error: More than one Program associated with ProgramData account {}",
                    programdata_address
                )
                .into());
            }
            programs.push(CliUpgradeableProgram {
                program_id: results[0].0.to_string(),
                owner: programdata_account.owner.to_string(),
                programdata_address: programdata_address.to_string(),
                authority: upgrade_authority_address
                    .map(|pubkey| pubkey.to_string())
                    .unwrap_or_else(|| "none".to_string()),
                last_deploy_slot: slot,
                data_len: programdata_account.data.len()
                    - UpgradeableLoaderState::size_of_programdata_metadata(),
                lamports: programdata_account.lamports,
                use_lamports_unit,
            });
        } else {
            return Err(
                format!("Error parsing ProgramData account {}", programdata_address).into(),
            );
        }
    }
    Ok(CliUpgradeablePrograms {
        programs,
        use_lamports_unit,
    })
}

async fn get_accounts_with_filter(
    rpc_client: &WasmClient,
    filters: Vec<RpcFilterType>,
    length: usize,
) -> Result<Vec<(Pubkey, Account)>, Box<dyn std::error::Error>> {
    let results = rpc_client
        .get_program_accounts_with_config(
            &bpf_loader_upgradeable::id(),
            RpcProgramAccountsConfig {
                filters: Some(filters),
                account_config: RpcAccountInfoConfig {
                    encoding: Some(UiAccountEncoding::Base64),
                    data_slice: Some(UiDataSliceConfig { offset: 0, length }),
                    ..RpcAccountInfoConfig::default()
                },
                ..RpcProgramAccountsConfig::default()
            },
        )
        .await?;
    Ok(results)
}

#[allow(clippy::too_many_arguments)]
async fn process_show(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    account_pubkey: Option<Pubkey>,
    authority_pubkey: Pubkey,
    programs: bool,
    buffers: bool,
    all: bool,
    use_lamports_unit: bool,
) -> ProcessResult {
    if let Some(account_pubkey) = account_pubkey {
        let account = rpc_client.get_account(&account_pubkey).await?;

        if account.owner == bpf_loader::id() || account.owner == bpf_loader_deprecated::id() {
            Ok(config.output_format.formatted_string(&CliProgram {
                program_id: account_pubkey.to_string(),
                owner: account.owner.to_string(),
                data_len: account.data.len(),
            }))
        } else if account.owner == bpf_loader_upgradeable::id() {
            if let Ok(UpgradeableLoaderState::Program {
                programdata_address,
            }) = account.state()
            {
                if let Some(programdata_account) = rpc_client
                    .get_account_with_commitment(&programdata_address, config.commitment_config)
                    .await?
                {
                    if let Ok(UpgradeableLoaderState::ProgramData {
                        upgrade_authority_address,
                        slot,
                    }) = programdata_account.state()
                    {
                        Ok(config
                            .output_format
                            .formatted_string(&CliUpgradeableProgram {
                                program_id: account_pubkey.to_string(),
                                owner: account.owner.to_string(),
                                programdata_address: programdata_address.to_string(),
                                authority: upgrade_authority_address
                                    .map(|pubkey| pubkey.to_string())
                                    .unwrap_or_else(|| "none".to_string()),
                                last_deploy_slot: slot,
                                data_len: programdata_account.data.len()
                                    - UpgradeableLoaderState::size_of_programdata_metadata(),
                                lamports: programdata_account.lamports,
                                use_lamports_unit,
                            }))
                    } else {
                        Err(format!("Program {} has been closed", account_pubkey).into())
                    }
                } else {
                    Err(format!("Program {} has been closed", account_pubkey).into())
                }
            } else if let Ok(UpgradeableLoaderState::Buffer { authority_address }) = account.state()
            {
                Ok(config
                    .output_format
                    .formatted_string(&CliUpgradeableBuffer {
                        address: account_pubkey.to_string(),
                        authority: authority_address
                            .map(|pubkey| pubkey.to_string())
                            .unwrap_or_else(|| "none".to_string()),
                        data_len: account.data.len()
                            - UpgradeableLoaderState::size_of_buffer_metadata(),
                        lamports: account.lamports,
                        use_lamports_unit,
                    }))
            } else {
                Err(format!(
                    "{} is not an upgradeable loader Buffer or Program account",
                    account_pubkey
                )
                .into())
            }
        } else {
            Err(format!("{} is not a BPF program", account_pubkey).into())
        }
    } else if programs {
        let authority_pubkey = if all { None } else { Some(authority_pubkey) };
        let programs = get_programs(rpc_client, authority_pubkey, use_lamports_unit).await?;
        Ok(config.output_format.formatted_string(&programs))
    } else if buffers {
        let authority_pubkey = if all { None } else { Some(authority_pubkey) };
        let buffers = get_buffers(rpc_client, authority_pubkey, use_lamports_unit).await?;
        Ok(config.output_format.formatted_string(&buffers))
    } else {
        Err("Invalid parameters".to_string().into())
    }
}

// fn process_dump(
//     rpc_client: &WasmClient,
//     config: &CliConfig<'_>,
//     account_pubkey: Option<Pubkey>,
//     output_location: &str,
// ) -> ProcessResult {
//     if let Some(account_pubkey) = account_pubkey {
//         if let Some(account) = rpc_client
//             .get_account_with_commitment(&account_pubkey, config.commitment_config)?
//             .value
//         {
//             if account.owner == bpf_loader::id() || account.owner == bpf_loader_deprecated::id() {
//                 let mut f = File::create(output_location)?;
//                 f.write_all(&account.data)?;
//                 Ok(format!("Wrote program to {}", output_location))
//             } else if account.owner == bpf_loader_upgradeable::id() {
//                 if let Ok(UpgradeableLoaderState::Program {
//                     programdata_address,
//                 }) = account.state()
//                 {
//                     if let Some(programdata_account) = rpc_client
//                         .get_account_with_commitment(&programdata_address, config.commitment_config)?
//                         .value
//                     {
//                         if let Ok(UpgradeableLoaderState::ProgramData { .. }) =
//                             programdata_account.state()
//                         {
//                             let offset = UpgradeableLoaderState::size_of_programdata_metadata();
//                             let program_data = &programdata_account.data[offset..];
//                             let mut f = File::create(output_location)?;
//                             f.write_all(program_data)?;
//                             Ok(format!("Wrote program to {}", output_location))
//                         } else {
//                             Err(format!("Program {} has been closed", account_pubkey).into())
//                         }
//                     } else {
//                         Err(format!("Program {} has been closed", account_pubkey).into())
//                     }
//                 } else if let Ok(UpgradeableLoaderState::Buffer { .. }) = account.state() {
//                     let offset = UpgradeableLoaderState::size_of_buffer_metadata();
//                     let program_data = &account.data[offset..];
//                     let mut f = File::create(output_location)?;
//                     f.write_all(program_data)?;
//                     Ok(format!("Wrote program to {}", output_location))
//                 } else {
//                     Err(format!(
//                         "{} is not an upgradeable loader buffer or program account",
//                         account_pubkey
//                     )
//                     .into())
//                 }
//             } else {
//                 Err(format!("{} is not a BPF program", account_pubkey).into())
//             }
//         } else {
//             Err(format!("Unable to find the account {}", account_pubkey).into())
//         }
//     } else {
//         Err("No account specified".into())
//     }
// }

async fn close(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    account_pubkey: &Pubkey,
    recipient_pubkey: &Pubkey,
    authority_signer: &dyn Signer,
    program_pubkey: Option<&Pubkey>,
) -> Result<(), Box<dyn std::error::Error>> {
    let blockhash = rpc_client.get_latest_blockhash().await?;

    let mut tx = Transaction::new_unsigned(Message::new(
        &[bpf_loader_upgradeable::close_any(
            account_pubkey,
            recipient_pubkey,
            Some(&authority_signer.pubkey()),
            program_pubkey,
        )],
        Some(&config.signers[0].pubkey()),
    ));

    tx.try_sign(&[config.signers[0], authority_signer], blockhash)?;
    let result = rpc_client
        .send_and_confirm_transaction_with_config(
            &tx,
            config.commitment_config,
            RpcSendTransactionConfig {
                skip_preflight: true,
                preflight_commitment: Some(config.commitment()),
                encoding: config.send_transaction_config.encoding,
                ..RpcSendTransactionConfig::default()
            },
        )
        .await;

    if let Err(e) = result {
        return Err(format!("Close failed: {e}").into());
    }

    Ok(())
}

async fn process_close(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    account_pubkey: Option<Pubkey>,
    recipient_pubkey: Pubkey,
    authority_index: SignerIndex,
    use_lamports_unit: bool,
) -> ProcessResult {
    let authority_signer = config.signers[authority_index];

    if let Some(account_pubkey) = account_pubkey {
        if let Some(account) = rpc_client
            .get_account_with_commitment(&account_pubkey, config.commitment_config)
            .await?
        {
            match account.state() {
                Ok(UpgradeableLoaderState::Buffer { authority_address }) => {
                    if authority_address != Some(authority_signer.pubkey()) {
                        return Err(format!(
                            "Buffer account authority {:?} does not match {:?}",
                            authority_address,
                            Some(authority_signer.pubkey())
                        )
                        .into());
                    } else {
                        close(
                            rpc_client,
                            config,
                            &account_pubkey,
                            &recipient_pubkey,
                            authority_signer,
                            None,
                        )
                        .await?;
                    }
                    Ok(config
                        .output_format
                        .formatted_string(&CliUpgradeableBuffers {
                            buffers: vec![CliUpgradeableBuffer {
                                address: account_pubkey.to_string(),
                                authority: authority_address
                                    .map(|pubkey| pubkey.to_string())
                                    .unwrap_or_else(|| "none".to_string()),
                                data_len: 0,
                                lamports: account.lamports,
                                use_lamports_unit,
                            }],
                            use_lamports_unit,
                        }))
                }
                Ok(UpgradeableLoaderState::Program {
                    programdata_address: programdata_pubkey,
                }) => {
                    if let Some(account) = rpc_client
                        .get_account_with_commitment(&programdata_pubkey, config.commitment_config)
                        .await?
                    {
                        if let Ok(UpgradeableLoaderState::ProgramData {
                            slot: _,
                            upgrade_authority_address: authority_pubkey,
                        }) = account.state()
                        {
                            if authority_pubkey != Some(authority_signer.pubkey()) {
                                Err(format!(
                                    "Program authority {:?} does not match {:?}",
                                    authority_pubkey,
                                    Some(authority_signer.pubkey())
                                )
                                .into())
                            } else {
                                close(
                                    rpc_client,
                                    config,
                                    &programdata_pubkey,
                                    &recipient_pubkey,
                                    authority_signer,
                                    Some(&account_pubkey),
                                )
                                .await?;
                                Ok(config.output_format.formatted_string(
                                    &CliUpgradeableProgramClosed {
                                        program_id: account_pubkey.to_string(),
                                        lamports: account.lamports,
                                        use_lamports_unit,
                                    },
                                ))
                            }
                        } else {
                            Err(format!("Program {} has been closed", account_pubkey).into())
                        }
                    } else {
                        Err(format!("Program {} has been closed", account_pubkey).into())
                    }
                }
                _ => Err(format!("{} is not a Program or Buffer account", account_pubkey).into()),
            }
        } else {
            Err(format!("Unable to find the account {}", account_pubkey).into())
        }
    } else {
        let buffers = get_buffers(
            rpc_client,
            Some(authority_signer.pubkey()),
            use_lamports_unit,
        )
        .await?;

        let mut closed = vec![];
        for buffer in buffers.buffers.iter() {
            if close(
                rpc_client,
                config,
                &Pubkey::from_str(&buffer.address)?,
                &recipient_pubkey,
                authority_signer,
                None,
            )
            .await
            .is_ok()
            {
                closed.push(buffer.clone());
            }
        }
        Ok(config
            .output_format
            .formatted_string(&CliUpgradeableBuffers {
                buffers: closed,
                use_lamports_unit,
            }))
    }
}

// /// Deploy using non-upgradeable loader
// pub fn process_deploy(
//     rpc_client: Arc<WasmClient>,
//     config: &CliConfig<'_>,
//     program_location: &str,
//     buffer_signer_index: Option<SignerIndex>,
//     use_deprecated_loader: bool,
//     allow_excessive_balance: bool,
//     skip_fee_check: bool,
// ) -> ProcessResult {
//     // Create ephemeral keypair to use for Buffer account, if not provided
//     let (words, mnemonic, buffer_keypair) = create_ephemeral_keypair()?;
//     let buffer_signer = if let Some(i) = buffer_signer_index {
//         config.signers[i]
//     } else {
//         &buffer_keypair
//     };

//     let program_data = read_and_verify_elf(program_location)?;
//     let minimum_balance = rpc_client.get_minimum_balance_for_rent_exemption(program_data.len())?;
//     let loader_id = if use_deprecated_loader {
//         bpf_loader_deprecated::id()
//     } else {
//         bpf_loader::id()
//     };

//     let result = do_process_program_write_and_deploy(
//         rpc_client,
//         config,
//         &program_data,
//         program_data.len(),
//         program_data.len(),
//         minimum_balance,
//         &loader_id,
//         Some(&[buffer_signer]),
//         Some(buffer_signer),
//         &buffer_signer.pubkey(),
//         Some(buffer_signer),
//         allow_excessive_balance,
//         skip_fee_check,
//     );
//     if result.is_err() && buffer_signer_index.is_none() {
//         report_ephemeral_mnemonic(words, mnemonic);
//     }
//     result
// }

// fn calculate_max_chunk_size<F>(create_msg: &F) -> usize
// where
//     F: Fn(u32, Vec<u8>) -> Message,
// {
//     let baseline_msg = create_msg(0, Vec::new());
//     let tx_size = bincode::serialized_size(&Transaction {
//         signatures: vec![
//             Signature::default();
//             baseline_msg.header.num_required_signatures as usize
//         ],
//         message: baseline_msg,
//     })
//     .unwrap() as usize;
//     // add 1 byte buffer to account for shortvec encoding
//     PACKET_DATA_SIZE.saturating_sub(tx_size).saturating_sub(1)
// }

// #[allow(clippy::too_many_arguments)]
// fn do_process_program_write_and_deploy(
//     rpc_client: Arc<WasmClient>,
//     config: &CliConfig<'_>,
//     program_data: &[u8],
//     program_len: usize,
//     programdata_len: usize,
//     minimum_balance: u64,
//     loader_id: &Pubkey,
//     program_signers: Option<&[&dyn Signer]>,
//     buffer_signer: Option<&dyn Signer>,
//     buffer_pubkey: &Pubkey,
//     buffer_authority_signer: Option<&dyn Signer>,
//     allow_excessive_balance: bool,
//     skip_fee_check: bool,
// ) -> ProcessResult {
//     // Build messages to calculate fees
//     let mut messages: Vec<&Message> = Vec::new();
//     let blockhash = rpc_client.get_latest_blockhash()?;

//     // Initialize buffer account or complete if already partially initialized
//     let (initial_message, write_messages, balance_needed) =
//         if let Some(buffer_authority_signer) = buffer_authority_signer {
//             let (initial_instructions, balance_needed) = if let Some(account) = rpc_client
//                 .get_account_with_commitment(buffer_pubkey, config.commitment_config)?
//                 .value
//             {
//                 complete_partial_program_init(
//                     loader_id,
//                     &config.signers[0].pubkey(),
//                     buffer_pubkey,
//                     &account,
//                     if loader_id == &bpf_loader_upgradeable::id() {
//                         UpgradeableLoaderState::size_of_buffer(program_len)
//                     } else {
//                         program_len
//                     },
//                     minimum_balance,
//                     allow_excessive_balance,
//                 )?
//             } else if loader_id == &bpf_loader_upgradeable::id() {
//                 (
//                     bpf_loader_upgradeable::create_buffer(
//                         &config.signers[0].pubkey(),
//                         buffer_pubkey,
//                         &buffer_authority_signer.pubkey(),
//                         minimum_balance,
//                         program_len,
//                     )?,
//                     minimum_balance,
//                 )
//             } else {
//                 (
//                     vec![system_instruction::create_account(
//                         &config.signers[0].pubkey(),
//                         buffer_pubkey,
//                         minimum_balance,
//                         program_len as u64,
//                         loader_id,
//                     )],
//                     minimum_balance,
//                 )
//             };
//             let initial_message = if !initial_instructions.is_empty() {
//                 Some(Message::new_with_blockhash(
//                     &initial_instructions,
//                     Some(&config.signers[0].pubkey()),
//                     &blockhash,
//                 ))
//             } else {
//                 None
//             };

//             // Create and add write messages

//             let payer_pubkey = config.signers[0].pubkey();
//             let create_msg = |offset: u32, bytes: Vec<u8>| {
//                 let instruction = if loader_id == &bpf_loader_upgradeable::id() {
//                     bpf_loader_upgradeable::write(
//                         buffer_pubkey,
//                         &buffer_authority_signer.pubkey(),
//                         offset,
//                         bytes,
//                     )
//                 } else {
//                     loader_instruction::write(buffer_pubkey, loader_id, offset, bytes)
//                 };
//                 Message::new_with_blockhash(&[instruction], Some(&payer_pubkey), &blockhash)
//             };

//             let mut write_messages = vec![];
//             let chunk_size = calculate_max_chunk_size(&create_msg);
//             for (chunk, i) in program_data.chunks(chunk_size).zip(0..) {
//                 write_messages.push(create_msg((i * chunk_size) as u32, chunk.to_vec()));
//             }

//             (initial_message, Some(write_messages), balance_needed)
//         } else {
//             (None, None, 0)
//         };

//     if let Some(ref initial_message) = initial_message {
//         messages.push(initial_message);
//     }
//     if let Some(ref write_messages) = write_messages {
//         let mut write_message_refs = vec![];
//         for message in write_messages.iter() {
//             write_message_refs.push(message);
//         }
//         messages.append(&mut write_message_refs);
//     }

//     // Create and add final message

//     let final_message = if let Some(program_signers) = program_signers {
//         let message = if loader_id == &bpf_loader_upgradeable::id() {
//             Message::new_with_blockhash(
//                 &bpf_loader_upgradeable::deploy_with_max_program_len(
//                     &config.signers[0].pubkey(),
//                     &program_signers[0].pubkey(),
//                     buffer_pubkey,
//                     &program_signers[1].pubkey(),
//                     rpc_client.get_minimum_balance_for_rent_exemption(
//                         UpgradeableLoaderState::size_of_program(),
//                     )?,
//                     programdata_len,
//                 )?,
//                 Some(&config.signers[0].pubkey()),
//                 &blockhash,
//             )
//         } else {
//             Message::new_with_blockhash(
//                 &[loader_instruction::finalize(buffer_pubkey, loader_id)],
//                 Some(&config.signers[0].pubkey()),
//                 &blockhash,
//             )
//         };
//         Some(message)
//     } else {
//         None
//     };
//     if let Some(ref message) = final_message {
//         messages.push(message);
//     }

//     if !skip_fee_check {
//         check_payer(
//             &rpc_client,
//             config,
//             balance_needed,
//             &initial_message,
//             &write_messages,
//             &final_message,
//         )?;
//     }

//     send_deploy_messages(
//         rpc_client,
//         config,
//         &initial_message,
//         &write_messages,
//         &final_message,
//         buffer_signer,
//         buffer_authority_signer,
//         program_signers,
//     )?;

//     if let Some(program_signers) = program_signers {
//         let program_id = CliProgramId {
//             program_id: program_signers[0].pubkey().to_string(),
//         };
//         Ok(config.output_format.formatted_string(&program_id))
//     } else {
//         let buffer = CliProgramBuffer {
//             buffer: buffer_pubkey.to_string(),
//         };
//         Ok(config.output_format.formatted_string(&buffer))
//     }
// }

// fn do_process_program_upgrade(
//     rpc_client: Arc<WasmClient>,
//     config: &CliConfig<'_>,
//     program_data: &[u8],
//     program_id: &Pubkey,
//     upgrade_authority: &dyn Signer,
//     buffer_pubkey: &Pubkey,
//     buffer_signer: Option<&dyn Signer>,
//     skip_fee_check: bool,
// ) -> ProcessResult {
//     let loader_id = bpf_loader_upgradeable::id();
//     let data_len = program_data.len();
//     let minimum_balance = rpc_client.get_minimum_balance_for_rent_exemption(
//         UpgradeableLoaderState::size_of_programdata(data_len),
//     )?;

//     // Build messages to calculate fees
//     let mut messages: Vec<&Message> = Vec::new();
//     let blockhash = rpc_client.get_latest_blockhash()?;

//     let (initial_message, write_messages, balance_needed) =
//         if let Some(buffer_signer) = buffer_signer {
//             // Check Buffer account to see if partial initialization has occurred
//             let (initial_instructions, balance_needed) = if let Some(account) = rpc_client
//                 .get_account_with_commitment(&buffer_signer.pubkey(), config.commitment_config)?
//                 .value
//             {
//                 complete_partial_program_init(
//                     &loader_id,
//                     &config.signers[0].pubkey(),
//                     &buffer_signer.pubkey(),
//                     &account,
//                     UpgradeableLoaderState::size_of_buffer(data_len),
//                     minimum_balance,
//                     true,
//                 )?
//             } else {
//                 (
//                     bpf_loader_upgradeable::create_buffer(
//                         &config.signers[0].pubkey(),
//                         buffer_pubkey,
//                         &upgrade_authority.pubkey(),
//                         minimum_balance,
//                         data_len,
//                     )?,
//                     minimum_balance,
//                 )
//             };

//             let initial_message = if !initial_instructions.is_empty() {
//                 Some(Message::new_with_blockhash(
//                     &initial_instructions,
//                     Some(&config.signers[0].pubkey()),
//                     &blockhash,
//                 ))
//             } else {
//                 None
//             };

//             let buffer_signer_pubkey = buffer_signer.pubkey();
//             let upgrade_authority_pubkey = upgrade_authority.pubkey();
//             let payer_pubkey = config.signers[0].pubkey();
//             let create_msg = |offset: u32, bytes: Vec<u8>| {
//                 let instruction = bpf_loader_upgradeable::write(
//                     &buffer_signer_pubkey,
//                     &upgrade_authority_pubkey,
//                     offset,
//                     bytes,
//                 );
//                 Message::new_with_blockhash(&[instruction], Some(&payer_pubkey), &blockhash)
//             };

//             // Create and add write messages
//             let mut write_messages = vec![];
//             let chunk_size = calculate_max_chunk_size(&create_msg);
//             for (chunk, i) in program_data.chunks(chunk_size).zip(0..) {
//                 write_messages.push(create_msg((i * chunk_size) as u32, chunk.to_vec()));
//             }

//             (initial_message, Some(write_messages), balance_needed)
//         } else {
//             (None, None, 0)
//         };

//     if let Some(ref message) = initial_message {
//         messages.push(message);
//     }
//     if let Some(ref write_messages) = write_messages {
//         let mut write_message_refs = vec![];
//         for message in write_messages.iter() {
//             write_message_refs.push(message);
//         }
//         messages.append(&mut write_message_refs);
//     }

//     // Create and add final message
//     let final_message = Message::new_with_blockhash(
//         &[bpf_loader_upgradeable::upgrade(
//             program_id,
//             buffer_pubkey,
//             &upgrade_authority.pubkey(),
//             &config.signers[0].pubkey(),
//         )],
//         Some(&config.signers[0].pubkey()),
//         &blockhash,
//     );
//     messages.push(&final_message);
//     let final_message = Some(final_message);

//     if !skip_fee_check {
//         check_payer(
//             &rpc_client,
//             config,
//             balance_needed,
//             &initial_message,
//             &write_messages,
//             &final_message,
//         )?;
//     }

//     send_deploy_messages(
//         rpc_client,
//         config,
//         &initial_message,
//         &write_messages,
//         &final_message,
//         buffer_signer,
//         Some(upgrade_authority),
//         Some(&[upgrade_authority]),
//     )?;

//     let program_id = CliProgramId {
//         program_id: program_id.to_string(),
//     };
//     Ok(config.output_format.formatted_string(&program_id))
// }

// fn read_and_verify_elf(program_location: &str) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
//     let mut file = File::open(program_location)
//         .map_err(|err| format!("Unable to open program file: {}", err))?;
//     let mut program_data = Vec::new();
//     file.read_to_end(&mut program_data)
//         .map_err(|err| format!("Unable to read program file: {}", err))?;
//     let mut transaction_context = TransactionContext::new(Vec::new(), 1, 1);
//     let mut invoke_context = InvokeContext::new_mock(&mut transaction_context, &[]);

//     // Verify the program
//     let executable = Executable::<BpfError, ThisInstructionMeter>::from_elf(
//         &program_data,
//         Config {
//             reject_broken_elfs: true,
//             ..Config::default()
//         },
//         register_syscalls(&mut invoke_context, true).unwrap(),
//     )
//     .map_err(|err| format!("ELF error: {}", err))?;

//     let _ =
//         VerifiedExecutable::<RequisiteVerifier, BpfError, ThisInstructionMeter>::from_executable(
//             executable,
//         )
//         .map_err(|err| format!("ELF error: {}", err))?;

//     Ok(program_data)
// }

// fn complete_partial_program_init(
//     loader_id: &Pubkey,
//     payer_pubkey: &Pubkey,
//     elf_pubkey: &Pubkey,
//     account: &Account,
//     account_data_len: usize,
//     minimum_balance: u64,
//     allow_excessive_balance: bool,
// ) -> Result<(Vec<Instruction>, u64), Box<dyn std::error::Error>> {
//     let mut instructions: Vec<Instruction> = vec![];
//     let mut balance_needed = 0;
//     if account.executable {
//         return Err("Buffer account is already executable".into());
//     }
//     if account.owner != *loader_id && !system_program::check_id(&account.owner) {
//         return Err("Buffer account passed is already in use by another program".into());
//     }
//     if !account.data.is_empty() && account.data.len() < account_data_len {
//         return Err(
//             "Buffer account passed is not large enough, may have been for a different deploy?"
//                 .into(),
//         );
//     }

//     if account.data.is_empty() && system_program::check_id(&account.owner) {
//         instructions.push(system_instruction::allocate(
//             elf_pubkey,
//             account_data_len as u64,
//         ));
//         instructions.push(system_instruction::assign(elf_pubkey, loader_id));
//         if account.lamports < minimum_balance {
//             let balance = minimum_balance - account.lamports;
//             instructions.push(system_instruction::transfer(
//                 payer_pubkey,
//                 elf_pubkey,
//                 balance,
//             ));
//             balance_needed = balance;
//         } else if account.lamports > minimum_balance
//             && system_program::check_id(&account.owner)
//             && !allow_excessive_balance
//         {
//             return Err(format!(
//                 "Buffer account has a balance: {:?}; it may already be in use",
//                 Sol(account.lamports)
//             )
//             .into());
//         }
//     }
//     Ok((instructions, balance_needed))
// }

// fn check_payer(
//     rpc_client: &WasmClient,
//     config: &CliConfig<'_>,
//     balance_needed: u64,
//     initial_message: &Option<Message>,
//     write_messages: &Option<Vec<Message>>,
//     final_message: &Option<Message>,
// ) -> Result<(), Box<dyn std::error::Error>> {
//     let mut fee = 0;
//     if let Some(message) = initial_message {
//         fee += rpc_client.get_fee_for_message(message)?;
//     }
//     if let Some(write_messages) = write_messages {
//         // Assume all write messages cost the same
//         if let Some(message) = write_messages.get(0) {
//             fee += rpc_client.get_fee_for_message(message)? * (write_messages.len() as u64);
//         }
//     }
//     if let Some(message) = final_message {
//         fee += rpc_client.get_fee_for_message(message)?;
//     }
//     check_account_for_spend_and_fee_with_commitment(
//         rpc_client,
//         &config.signers[0].pubkey(),
//         balance_needed,
//         fee,
//         config.commitment_config,
//     )?;
//     Ok(())
// }

// fn send_deploy_messages(
//     rpc_client: Arc<WasmClient>,
//     config: &CliConfig<'_>,
//     initial_message: &Option<Message>,
//     write_messages: &Option<Vec<Message>>,
//     final_message: &Option<Message>,
//     initial_signer: Option<&dyn Signer>,
//     write_signer: Option<&dyn Signer>,
//     final_signers: Option<&[&dyn Signer]>,
// ) -> Result<(), Box<dyn std::error::Error>> {
//     let payer_signer = config.signers[0];

//     if let Some(message) = initial_message {
//         if let Some(initial_signer) = initial_signer {
//             trace!("Preparing the required accounts");
//             let blockhash = rpc_client.get_latest_blockhash()?;

//             let mut initial_transaction = Transaction::new_unsigned(message.clone());
//             // Most of the initial_transaction combinations require both the fee-payer and new program
//             // account to sign the transaction. One (transfer) only requires the fee-payer signature.
//             // This check is to ensure signing does not fail on a KeypairPubkeyMismatch error from an
//             // extraneous signature.
//             if message.header.num_required_signatures == 2 {
//                 initial_transaction.try_sign(&[payer_signer, initial_signer], blockhash)?;
//             } else {
//                 initial_transaction.try_sign(&[payer_signer], blockhash)?;
//             }
//             let result = rpc_client.send_and_confirm_transaction_with_spinner(&initial_transaction);
//             log_instruction_custom_error::<SystemError>(result, config)
//                 .map_err(|err| format!("Account allocation failed: {}", err))?;
//         } else {
//             return Err("Buffer account not created yet, must provide a key pair".into());
//         }
//     }

//     if let Some(write_messages) = write_messages {
//         if let Some(write_signer) = write_signer {
//             trace!("Writing program data");
//             let tpu_client = TpuClient::new(
//                 rpc_client.clone(),
//                 &config.websocket_url,
//                 TpuClientConfig::default(),
//             )?;
//             let transaction_errors = tpu_client
//                 .send_and_confirm_messages_with_spinner(
//                     write_messages,
//                     &[payer_signer, write_signer],
//                 )
//                 .map_err(|err| format!("Data writes to account failed: {}", err))?
//                 .into_iter()
//                 .flatten()
//                 .collect::<Vec<_>>();

//             if !transaction_errors.is_empty() {
//                 for transaction_error in &transaction_errors {
//                     PgTerminal::log_wasm("{:?}", transaction_error);
//                 }
//                 return Err(
//                     format!("{} write transactions failed", transaction_errors.len()).into(),
//                 );
//             }
//         }
//     }

//     if let Some(message) = final_message {
//         if let Some(final_signers) = final_signers {
//             trace!("Deploying program");
//             let blockhash = rpc_client.get_latest_blockhash()?;

//             let mut final_tx = Transaction::new_unsigned(message.clone());
//             let mut signers = final_signers.to_vec();
//             signers.push(payer_signer);
//             final_tx.try_sign(&signers, blockhash)?;
//             rpc_client
//                 .send_and_confirm_transaction_with_config(
//                     &final_tx,
//                     config.commitment_config,
//                     RpcSendTransactionConfig {
//                         skip_preflight: true,
//                         preflight_commitment: Some(config.commitment()),
//                         ..RpcSendTransactionConfig::default()
//                     },
//                 )
//                 .map_err(|e| format!("Deploying program failed: {}", e))?;
//         }
//     }

//     Ok(())
// }

// fn create_ephemeral_keypair(
// ) -> Result<(usize, bip39::Mnemonic, Keypair), Box<dyn std::error::Error>> {
//     const WORDS: usize = 12;
//     let mnemonic = Mnemonic::new(MnemonicType::for_word_count(WORDS)?, Language::English);
//     let seed = Seed::new(&mnemonic, "");
//     let new_keypair = keypair_from_seed(seed.as_bytes())?;

//     Ok((WORDS, mnemonic, new_keypair))
// }

// fn report_ephemeral_mnemonic(words: usize, mnemonic: bip39::Mnemonic) {
//     let phrase: &str = mnemonic.phrase();
//     let divider = String::from_utf8(vec![b'='; phrase.len()]).unwrap();
//     PgTerminal::log_wasm(
//         "{}\nRecover the intermediate account's ephemeral keypair file with",
//         divider
//     );
//     PgTerminal::log_wasm(
//         "`solana-keygen recover` and the following {}-word seed phrase:",
//         words
//     );
//     PgTerminal::log_wasm("{}\n{}\n{}", divider, phrase, divider);
//     PgTerminal::log_wasm("To resume a deploy, pass the recovered keypair as the");
//     PgTerminal::log_wasm("[BUFFER_SIGNER] to `solana program deploy` or `solana program write-buffer'.");
//     PgTerminal::log_wasm("Or to recover the account's lamports, pass it as the");
//     PgTerminal::log_wasm(
//         "[BUFFER_ACCOUNT_ADDRESS] argument to `solana program close`.\n{}",
//         divider
//     );
// }
