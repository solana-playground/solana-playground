pub mod parse_token;
pub mod parse_token_extension;

use std::str::FromStr;

use serde_json::Value;
use solana_sdk::{
    account::{ReadableAccount, WritableAccount},
    clock::Epoch,
    instruction::InstructionError,
    pubkey::Pubkey,
};
// TODO:
// use spl_token_2022::extension::{self, BaseState, ExtensionType, StateWithExtensions};
use thiserror::Error;

pub type StringAmount = String;
pub type StringDecimals = String;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UiDataSliceConfig {
    pub offset: usize,
    pub length: usize,
}

fn slice_data(data: &[u8], data_slice_config: Option<UiDataSliceConfig>) -> &[u8] {
    if let Some(UiDataSliceConfig { offset, length }) = data_slice_config {
        if offset >= data.len() {
            &[]
        } else if length > data.len() - offset {
            &data[offset..]
        } else {
            &data[offset..offset + length]
        }
    } else {
        data
    }
}

/// A duplicate representation of an Account for pretty JSON serialization
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct UiAccount {
    pub lamports: u64,
    pub data: UiAccountData,
    pub owner: String,
    pub executable: bool,
    pub rent_epoch: Epoch,
    pub space: Option<u64>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", untagged)]
pub enum UiAccountData {
    LegacyBinary(String), // Legacy. Retained for RPC backwards compatibility
    Json(ParsedAccount),
    Binary(String, UiAccountEncoding),
}

#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq, Hash)]
#[serde(rename_all = "camelCase")]
pub enum UiAccountEncoding {
    Binary, // Legacy. Retained for RPC backwards compatibility
    Base58,
    Base64,
    JsonParsed,
    // NOTE: Not supported in WASM
    // #[serde(rename = "base64+zstd")]
    // Base64Zstd,
}

pub const MAX_BASE58_BYTES: usize = 128;

impl UiAccount {
    fn encode_bs58<T: ReadableAccount>(
        account: &T,
        data_slice_config: Option<UiDataSliceConfig>,
    ) -> String {
        if account.data().len() <= MAX_BASE58_BYTES {
            bs58::encode(slice_data(account.data(), data_slice_config)).into_string()
        } else {
            "error: data too large for bs58 encoding".to_string()
        }
    }

    pub fn encode<T: ReadableAccount>(
        pubkey: &Pubkey,
        account: &T,
        encoding: UiAccountEncoding,
        additional_data: Option<AccountAdditionalData>,
        data_slice_config: Option<UiDataSliceConfig>,
    ) -> Self {
        let data = match encoding {
            UiAccountEncoding::Binary => {
                let data = Self::encode_bs58(account, data_slice_config);
                UiAccountData::LegacyBinary(data)
            }
            UiAccountEncoding::Base58 => {
                let data = Self::encode_bs58(account, data_slice_config);
                UiAccountData::Binary(data, encoding)
            }
            UiAccountEncoding::Base64 => UiAccountData::Binary(
                base64::encode(slice_data(account.data(), data_slice_config)),
                encoding,
            ),
            // NOTE: Not supported in WASM
            // UiAccountEncoding::Base64Zstd => {
            //     let mut encoder = zstd::stream::write::Encoder::new(Vec::new(), 0).unwrap();
            //     match encoder
            //         .write_all(slice_data(account.data(), data_slice_config))
            //         .and_then(|()| encoder.finish())
            //     {
            //         Ok(zstd_data) => UiAccountData::Binary(base64::encode(zstd_data), encoding),
            //         Err(_) => UiAccountData::Binary(
            //             base64::encode(slice_data(account.data(), data_slice_config)),
            //             UiAccountEncoding::Base64,
            //         ),
            //     }
            // }
            UiAccountEncoding::JsonParsed => {
                if let Ok(parsed_data) =
                    parse_account_data(pubkey, account.owner(), account.data(), additional_data)
                {
                    UiAccountData::Json(parsed_data)
                } else {
                    UiAccountData::Binary(base64::encode(account.data()), UiAccountEncoding::Base64)
                }
            }
        };
        UiAccount {
            lamports: account.lamports(),
            space: Some(account.data().len() as u64),
            data,
            owner: account.owner().to_string(),
            executable: account.executable(),
            rent_epoch: account.rent_epoch(),
        }
    }

    pub fn decode<T: WritableAccount>(&self) -> Option<T> {
        let data = match &self.data {
            UiAccountData::Json(_) => None,
            UiAccountData::LegacyBinary(blob) => bs58::decode(blob).into_vec().ok(),
            UiAccountData::Binary(blob, encoding) => match encoding {
                UiAccountEncoding::Base58 => bs58::decode(blob).into_vec().ok(),
                UiAccountEncoding::Base64 => base64::decode(blob).ok(),
                // NOTE: Not supported in WASM
                // UiAccountEncoding::Base64Zstd => base64::decode(blob).ok().and_then(|zstd_data| {
                //     let mut data = vec![];
                //     zstd::stream::read::Decoder::new(zstd_data.as_slice())
                //         .and_then(|mut reader| reader.read_to_end(&mut data))
                //         .map(|_| data)
                //         .ok()
                // }),
                UiAccountEncoding::Binary | UiAccountEncoding::JsonParsed => None,
            },
        }?;
        Some(T::create(
            self.lamports,
            data,
            Pubkey::from_str(&self.owner).ok()?,
            self.executable,
            self.rent_epoch,
        ))
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ParsedAccount {
    pub program: String,
    pub parsed: Value,
    pub space: u64,
}

#[derive(Default)]
pub struct AccountAdditionalData {
    pub spl_token_decimals: Option<u8>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ParsableAccount {
    BpfUpgradeableLoader,
    Config,
    Nonce,
    SplToken,
    SplToken2022,
    Stake,
    Sysvar,
    Vote,
}

#[derive(Error, Debug)]
pub enum ParseAccountError {
    #[error("{0:?} account not parsable")]
    AccountNotParsable(ParsableAccount),

    #[error("Program not parsable")]
    ProgramNotParsable,

    #[error("Additional data required to parse: {0}")]
    AdditionalDataMissing(String),

    #[error("Instruction error")]
    InstructionError(#[from] InstructionError),

    #[error("Serde json error")]
    SerdeJsonError(#[from] serde_json::error::Error),
}

pub fn parse_account_data(
    _pubkey: &Pubkey,
    _program_id: &Pubkey,
    _data: &[u8],
    _additional_data: Option<AccountAdditionalData>,
) -> Result<ParsedAccount, ParseAccountError> {
    // TODO:
    Err(ParseAccountError::ProgramNotParsable)
    // let program_name = PARSABLE_PROGRAM_IDS
    //     .get(program_id)
    //     .ok_or(ParseAccountError::ProgramNotParsable)?;
    // let additional_data = additional_data.unwrap_or_default();
    // let parsed_json = match program_name {
    //     ParsableAccount::BpfUpgradeableLoader => {
    //         serde_json::to_value(parse_bpf_upgradeable_loader(data)?)?
    //     }
    //     ParsableAccount::Config => serde_json::to_value(parse_config(data, pubkey)?)?,
    //     ParsableAccount::Nonce => serde_json::to_value(parse_nonce(data)?)?,
    //     ParsableAccount::SplToken | ParsableAccount::SplToken2022 => {
    //         serde_json::to_value(parse_token(data, additional_data.spl_token_decimals)?)?
    //     }
    //     ParsableAccount::Stake => serde_json::to_value(parse_stake(data)?)?,
    //     ParsableAccount::Sysvar => serde_json::to_value(parse_sysvar(data, pubkey)?)?,
    //     ParsableAccount::Vote => serde_json::to_value(parse_vote(data)?)?,
    // };
    // Ok(ParsedAccount {
    //     program: format!("{:?}", program_name).to_kebab_case(),
    //     parsed: parsed_json,
    //     space: data.len() as u64,
    // })
}
