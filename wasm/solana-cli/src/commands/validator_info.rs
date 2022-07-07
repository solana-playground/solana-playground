// use {
//     crate::{
//         cli::{CliCommand, CliCommandInfo, CliConfig, CliError, ProcessResult},
//         spend_utils::{resolve_spend_tx_and_check_account_balance, SpendAmount},
//     },
//     bincode::deserialize,
//     clap::{App, AppSettings, Arg, ArgMatches, SubCommand},
//     reqwest::blocking::Client,
//     serde_json::{Map, Value},
//     solana_account_decoder::validator_info::{
//         self, ValidatorInfo, MAX_LONG_FIELD_LENGTH, MAX_SHORT_FIELD_LENGTH,
//     },
//     solana_clap_utils::{
//         input_parsers::pubkey_of,
//         input_validators::{is_pubkey, is_url},
//         keypair::DefaultSigner,
//     },
//     solana_cli_output::{CliValidatorInfo, CliValidatorInfoVec},
//     solana_client::rpc_client::WasmClient,
//     solana_config_program::{config_instruction, get_config_data, ConfigKeys, ConfigState},
//     solana_remote_wallet::remote_wallet::RemoteWalletManager,
//     solana_sdk::{
//         account::Account,
//         message::Message,
//         pubkey::Pubkey,
//         signature::{Keypair, Signer},
//         transaction::Transaction,
//     },
//     std::{error, sync::Arc},
// };

// // Return an error if a validator details are longer than the max length.
// pub fn check_details_length(string: String) -> Result<(), String> {
//     if string.len() > MAX_LONG_FIELD_LENGTH {
//         Err(format!(
//             "validator details longer than {:?}-byte limit",
//             MAX_LONG_FIELD_LENGTH
//         ))
//     } else {
//         Ok(())
//     }
// }

// // Return an error if url field is too long or cannot be parsed.
// pub fn check_url(string: String) -> Result<(), String> {
//     is_url(string.clone())?;
//     if string.len() > MAX_SHORT_FIELD_LENGTH {
//         Err(format!(
//             "url longer than {:?}-byte limit",
//             MAX_SHORT_FIELD_LENGTH
//         ))
//     } else {
//         Ok(())
//     }
// }

// // Return an error if a validator field is longer than the max length.
// pub fn is_short_field(string: String) -> Result<(), String> {
//     if string.len() > MAX_SHORT_FIELD_LENGTH {
//         Err(format!(
//             "validator field longer than {:?}-byte limit",
//             MAX_SHORT_FIELD_LENGTH
//         ))
//     } else {
//         Ok(())
//     }
// }

// fn verify_keybase(
//     validator_pubkey: &Pubkey,
//     keybase_username: &Value,
// ) -> Result<(), Box<dyn error::Error>> {
//     if let Some(keybase_username) = keybase_username.as_str() {
//         let url = format!(
//             "https://keybase.pub/{}/solana/validator-{:?}",
//             keybase_username, validator_pubkey
//         );
//         let client = Client::new();
//         if client.head(&url).send()?.status().is_success() {
//             Ok(())
//         } else {
//             Err(format!("keybase_username could not be confirmed at: {}. Please add this pubkey file to your keybase profile to connect", url).into())
//         }
//     } else {
//         Err(format!(
//             "keybase_username could not be parsed as String: {}",
//             keybase_username
//         )
//         .into())
//     }
// }

// fn parse_args(matches: &ArgMatches<'_>) -> Value {
//     let mut map = Map::new();
//     map.insert(
//         "name".to_string(),
//         Value::String(matches.value_of("name").unwrap().to_string()),
//     );
//     if let Some(url) = matches.value_of("website") {
//         map.insert("website".to_string(), Value::String(url.to_string()));
//     }
//     if let Some(details) = matches.value_of("details") {
//         map.insert("details".to_string(), Value::String(details.to_string()));
//     }
//     if let Some(keybase_username) = matches.value_of("keybase_username") {
//         map.insert(
//             "keybaseUsername".to_string(),
//             Value::String(keybase_username.to_string()),
//         );
//     }
//     Value::Object(map)
// }

// fn parse_validator_info(
//     pubkey: &Pubkey,
//     account: &Account,
// ) -> Result<(Pubkey, Map<String, serde_json::value::Value>), Box<dyn error::Error>> {
//     if account.owner != solana_config_program::id() {
//         return Err(format!("{} is not a validator info account", pubkey).into());
//     }
//     let key_list: ConfigKeys = deserialize(&account.data)?;
//     if !key_list.keys.is_empty() {
//         let (validator_pubkey, _) = key_list.keys[1];
//         let validator_info_string: String = deserialize(get_config_data(&account.data)?)?;
//         let validator_info: Map<_, _> = serde_json::from_str(&validator_info_string)?;
//         Ok((validator_pubkey, validator_info))
//     } else {
//         Err(format!("{} could not be parsed as a validator info account", pubkey).into())
//     }
// }

// pub trait ValidatorInfoSubCommands {
//     fn validator_info_subcommands(self) -> Self;
// }

// impl ValidatorInfoSubCommands for App<'_, '_> {
//     fn validator_info_subcommands(self) -> Self {
//         self.subcommand(
//             SubCommand::with_name("validator-info")
//                 .about("Publish/get Validator info on Solana")
//                 .setting(AppSettings::SubcommandRequiredElseHelp)
//                 .subcommand(
//                     SubCommand::with_name("publish")
//                         .about("Publish Validator info on Solana")
//                         .arg(
//                             Arg::with_name("info_pubkey")
//                                 .short("p")
//                                 .long("info-pubkey")
//                                 .value_name("PUBKEY")
//                                 .takes_value(true)
//                                 .validator(is_pubkey)
//                                 .help("The pubkey of the Validator info account to update"),
//                         )
//                         .arg(
//                             Arg::with_name("name")
//                                 .index(1)
//                                 .value_name("NAME")
//                                 .takes_value(true)
//                                 .required(true)
//                                 .validator(is_short_field)
//                                 .help("Validator name"),
//                         )
//                         .arg(
//                             Arg::with_name("website")
//                                 .short("w")
//                                 .long("website")
//                                 .value_name("URL")
//                                 .takes_value(true)
//                                 .validator(check_url)
//                                 .help("Validator website url"),
//                         )
//                         .arg(
//                             Arg::with_name("keybase_username")
//                                 .short("n")
//                                 .long("keybase")
//                                 .value_name("USERNAME")
//                                 .takes_value(true)
//                                 .validator(is_short_field)
//                                 .help("Validator Keybase username"),
//                         )
//                         .arg(
//                             Arg::with_name("details")
//                                 .short("d")
//                                 .long("details")
//                                 .value_name("DETAILS")
//                                 .takes_value(true)
//                                 .validator(check_details_length)
//                                 .help("Validator description")
//                         )
//                         .arg(
//                             Arg::with_name("force")
//                                 .long("force")
//                                 .takes_value(false)
//                                 .hidden(true) // Don't document this argument to discourage its use
//                                 .help("Override keybase username validity check"),
//                         ),
//                 )
//                 .subcommand(
//                     SubCommand::with_name("get")
//                         .about("Get and parse Solana Validator info")
//                         .arg(
//                             Arg::with_name("info_pubkey")
//                                 .index(1)
//                                 .value_name("PUBKEY")
//                                 .takes_value(true)
//                                 .validator(is_pubkey)
//                                 .help("The pubkey of the Validator info account; without this argument, returns all"),
//                         ),
//                 )
//         )
//     }
// }

// pub fn parse_validator_info_command(
//     matches: &ArgMatches<'_>,
//     default_signer: &DefaultSigner,
//     wallet_manager: &mut Option<Arc<RemoteWalletManager>>,
// ) -> Result<CliCommandInfo, CliError> {
//     let info_pubkey = pubkey_of(matches, "info_pubkey");
//     // Prepare validator info
//     let validator_info = parse_args(matches);
//     Ok(CliCommandInfo {
//         command: CliCommand::SetValidatorInfo {
//             validator_info,
//             force_keybase: matches.is_present("force"),
//             info_pubkey,
//         },
//         signers: vec![default_signer.signer_from_path(matches, wallet_manager)?],
//     })
// }

// pub fn parse_get_validator_info_command(
//     matches: &ArgMatches<'_>,
// ) -> Result<CliCommandInfo, CliError> {
//     let info_pubkey = pubkey_of(matches, "info_pubkey");
//     Ok(CliCommandInfo {
//         command: CliCommand::GetValidatorInfo(info_pubkey),
//         signers: vec![],
//     })
// }

// pub fn process_set_validator_info(
//     rpc_client: &WasmClient,
//     config: &CliConfig,
//     validator_info: &Value,
//     force_keybase: bool,
//     info_pubkey: Option<Pubkey>,
// ) -> ProcessResult {
//     // Validate keybase username
//     if let Some(string) = validator_info.get("keybaseUsername") {
//         let result = verify_keybase(&config.signers[0].pubkey(), string);
//         if result.is_err() {
//             if force_keybase {
//                 println!("--force supplied, ignoring: {:?}", result);
//             } else {
//                 result.map_err(|err| {
//                     CliError::BadParameter(format!("Invalid validator keybase username: {}", err))
//                 })?;
//             }
//         }
//     }
//     let validator_string = serde_json::to_string(&validator_info).unwrap();
//     let validator_info = ValidatorInfo {
//         info: validator_string,
//     };
//     // Check for existing validator-info account
//     let all_config = rpc_client.get_program_accounts(&solana_config_program::id())?;
//     let existing_account = all_config
//         .iter()
//         .filter(
//             |(_, account)| match deserialize::<ConfigKeys>(&account.data) {
//                 Ok(key_list) => key_list.keys.contains(&(validator_info::id(), false)),
//                 Err(_) => false,
//             },
//         )
//         .find(|(pubkey, account)| {
//             let (validator_pubkey, _) = parse_validator_info(pubkey, account).unwrap();
//             validator_pubkey == config.signers[0].pubkey()
//         });

//     // Create validator-info keypair to use if info_pubkey not provided or does not exist
//     let info_keypair = Keypair::new();
//     let mut info_pubkey = if let Some(pubkey) = info_pubkey {
//         pubkey
//     } else if let Some(validator_info) = existing_account {
//         validator_info.0
//     } else {
//         info_keypair.pubkey()
//     };

//     // Check existence of validator-info account
//     let balance = rpc_client.get_balance(&info_pubkey).unwrap_or(0);

//     let keys = vec![
//         (validator_info::id(), false),
//         (config.signers[0].pubkey(), true),
//     ];
//     let data_len = ValidatorInfo::max_space() + ConfigKeys::serialized_size(keys.clone());
//     let lamports = rpc_client.get_minimum_balance_for_rent_exemption(data_len as usize)?;

//     let signers = if balance == 0 {
//         if info_pubkey != info_keypair.pubkey() {
//             println!(
//                 "Account {:?} does not exist. Generating new keypair...",
//                 info_pubkey
//             );
//             info_pubkey = info_keypair.pubkey();
//         }
//         vec![config.signers[0], &info_keypair]
//     } else {
//         vec![config.signers[0]]
//     };

//     let build_message = |lamports| {
//         let keys = keys.clone();
//         if balance == 0 {
//             println!(
//                 "Publishing info for Validator {:?}",
//                 config.signers[0].pubkey()
//             );
//             let mut instructions = config_instruction::create_account::<ValidatorInfo>(
//                 &config.signers[0].pubkey(),
//                 &info_pubkey,
//                 lamports,
//                 keys.clone(),
//             );
//             instructions.extend_from_slice(&[config_instruction::store(
//                 &info_pubkey,
//                 true,
//                 keys,
//                 &validator_info,
//             )]);
//             Message::new(&instructions, Some(&config.signers[0].pubkey()))
//         } else {
//             println!(
//                 "Updating Validator {:?} info at: {:?}",
//                 config.signers[0].pubkey(),
//                 info_pubkey
//             );
//             let instructions = vec![config_instruction::store(
//                 &info_pubkey,
//                 false,
//                 keys,
//                 &validator_info,
//             )];
//             Message::new(&instructions, Some(&config.signers[0].pubkey()))
//         }
//     };

//     // Submit transaction
//     let latest_blockhash = rpc_client.get_latest_blockhash()?;
//     let (message, _) = resolve_spend_tx_and_check_account_balance(
//         rpc_client,
//         false,
//         SpendAmount::Some(lamports),
//         &latest_blockhash,
//         &config.signers[0].pubkey(),
//         build_message,
//         config.commitment,
//     )?;
//     let mut tx = Transaction::new_unsigned(message);
//     tx.try_sign(&signers, latest_blockhash)?;
//     let signature_str = rpc_client.send_and_confirm_transaction_with_spinner(&tx)?;

//     println!("Success! Validator info published at: {:?}", info_pubkey);
//     println!("{}", signature_str);
//     Ok("".to_string())
// }

// pub fn process_get_validator_info(
//     rpc_client: &WasmClient,
//     config: &CliConfig,
//     pubkey: Option<Pubkey>,
// ) -> ProcessResult {
//     let validator_info: Vec<(Pubkey, Account)> = if let Some(validator_info_pubkey) = pubkey {
//         vec![(
//             validator_info_pubkey,
//             rpc_client.get_account(&validator_info_pubkey)?,
//         )]
//     } else {
//         let all_config = rpc_client.get_program_accounts(&solana_config_program::id())?;
//         all_config
//             .into_iter()
//             .filter(|(_, validator_info_account)| {
//                 match deserialize::<ConfigKeys>(&validator_info_account.data) {
//                     Ok(key_list) => key_list.keys.contains(&(validator_info::id(), false)),
//                     Err(_) => false,
//                 }
//             })
//             .collect()
//     };

//     let mut validator_info_list: Vec<CliValidatorInfo> = vec![];
//     if validator_info.is_empty() {
//         println!("No validator info accounts found");
//     }
//     for (validator_info_pubkey, validator_info_account) in validator_info.iter() {
//         let (validator_pubkey, validator_info) =
//             parse_validator_info(validator_info_pubkey, validator_info_account)?;
//         validator_info_list.push(CliValidatorInfo {
//             identity_pubkey: validator_pubkey.to_string(),
//             info_pubkey: validator_info_pubkey.to_string(),
//             info: validator_info,
//         });
//     }
//     Ok(config
//         .output_format
//         .formatted_string(&CliValidatorInfoVec::new(validator_info_list)))
// }
