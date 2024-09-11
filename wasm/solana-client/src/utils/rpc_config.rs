use bincode::serialize;
use serde_with::{serde_as, skip_serializing_none, DisplayFromStr};
use solana_extra_wasm::{
    account_decoder::{UiAccount, UiAccountEncoding, UiDataSliceConfig},
    transaction_status::{TransactionDetails, UiTransactionEncoding},
};
use solana_sdk::{
    clock::{Epoch, Slot},
    commitment_config::{CommitmentConfig, CommitmentLevel},
    hash::Hash,
    pubkey::Pubkey,
    signature::Signature,
};

use super::rpc_filter::RpcFilterType;
use crate::{utils::nonce_utils, ClientError, ClientResult, WasmClient};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RpcKeyedAccount {
    pub pubkey: String,
    pub account: UiAccount,
}

#[derive(Debug, PartialEq, Eq)]
pub enum Source {
    Cluster,
    NonceAccount(Pubkey),
}

impl Source {
    pub async fn get_blockhash(
        &self,
        rpc_client: &WasmClient,
        commitment_config: CommitmentConfig,
    ) -> Result<Hash, Box<dyn std::error::Error>> {
        match self {
            Self::Cluster => {
                let (blockhash, _) = rpc_client
                    .get_latest_blockhash_with_config(commitment_config)
                    .await?;
                Ok(blockhash)
            }
            Self::NonceAccount(ref pubkey) => {
                #[allow(clippy::redundant_closure)]
                let data =
                    nonce_utils::get_account_with_commitment(rpc_client, pubkey, commitment_config)
                        .await
                        .and_then(|ref a| nonce_utils::data_from_account(a))?;
                Ok(data.blockhash())
            }
        }
    }

    pub async fn is_blockhash_valid(
        &self,
        rpc_client: &WasmClient,
        blockhash: &Hash,
        commitment_config: CommitmentConfig,
    ) -> Result<bool, Box<dyn std::error::Error>> {
        Ok(match self {
            Self::Cluster => {
                rpc_client
                    .is_blockhash_valid(blockhash, commitment_config)
                    .await?
            }
            Self::NonceAccount(ref pubkey) => {
                #[allow(clippy::redundant_closure)]
                let _ =
                    nonce_utils::get_account_with_commitment(rpc_client, pubkey, commitment_config)
                        .await
                        .and_then(|ref a| nonce_utils::data_from_account(a))?;
                true
            }
        })
    }
}

#[derive(Debug, PartialEq, Eq)]
pub enum BlockhashQuery {
    None(Hash),
    FeeCalculator(Source, Hash),
    All(Source),
}

impl BlockhashQuery {
    pub fn new(blockhash: Option<Hash>, sign_only: bool, nonce_account: Option<Pubkey>) -> Self {
        let source = nonce_account
            .map(Source::NonceAccount)
            .unwrap_or(Source::Cluster);
        match blockhash {
            Some(hash) if sign_only => Self::None(hash),
            Some(hash) if !sign_only => Self::FeeCalculator(source, hash),
            None if !sign_only => Self::All(source),
            _ => panic!("Cannot resolve blockhash"),
        }
    }

    pub async fn get_blockhash(
        &self,
        rpc_client: &WasmClient,
        commitment_config: CommitmentConfig,
    ) -> Result<Hash, Box<dyn std::error::Error>> {
        match self {
            BlockhashQuery::None(hash) => Ok(*hash),
            BlockhashQuery::FeeCalculator(source, hash) => {
                if !source
                    .is_blockhash_valid(rpc_client, hash, commitment_config)
                    .await?
                {
                    return Err(format!("Hash has expired {:?}", hash).into());
                }
                Ok(*hash)
            }
            BlockhashQuery::All(source) => {
                source.get_blockhash(rpc_client, commitment_config).await
            }
        }
    }
}

impl Default for BlockhashQuery {
    fn default() -> Self {
        BlockhashQuery::All(Source::Cluster)
    }
}

pub fn serialize_and_encode<T>(input: &T, encoding: UiTransactionEncoding) -> ClientResult<String>
where
    T: serde::ser::Serialize,
{
    let serialized =
        serialize(input).map_err(|e| ClientError::new(format!("Serialization failed: {}", e)))?;
    let encoded = match encoding {
        UiTransactionEncoding::Base58 => bs58::encode(serialized).into_string(),
        UiTransactionEncoding::Base64 => base64::encode(serialized),
        _ => {
            return Err(ClientError::new(format!(
                "unsupported encoding: {}. Supported encodings: base58, base64",
                encoding
            )))
        }
    };
    Ok(encoded)
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RpcSignatureStatusConfig {
    pub search_transaction_history: bool,
}

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RpcSendTransactionConfig {
    #[serde(default)]
    pub skip_preflight: bool,
    pub preflight_commitment: Option<CommitmentLevel>,
    pub encoding: Option<UiTransactionEncoding>,
    pub max_retries: Option<usize>,
    pub min_context_slot: Option<Slot>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RpcSimulateTransactionAccountsConfig {
    pub encoding: Option<UiAccountEncoding>,
    pub addresses: Vec<String>,
}

#[skip_serializing_none]
#[derive(Debug, Default, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RpcSimulateTransactionConfig {
    #[serde(default)]
    pub sig_verify: Option<bool>,
    #[serde(default)]
    pub replace_recent_blockhash: Option<bool>,
    #[serde(flatten)]
    pub commitment: Option<CommitmentConfig>,
    pub encoding: Option<UiTransactionEncoding>,
    pub accounts: Option<RpcSimulateTransactionAccountsConfig>,
    pub min_context_slot: Option<Slot>,
}

#[derive(Debug, Default, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RpcRequestAirdropConfig {
    pub recent_blockhash: Option<String>, // base-58 encoded blockhash
    #[serde(flatten)]
    pub commitment: Option<CommitmentConfig>,
}

#[serde_as]
#[derive(Debug, Default, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RpcLeaderScheduleConfig {
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub identity: Option<Pubkey>, // validator identity, as a base-58 encoded string
    #[serde(flatten)]
    pub commitment: Option<CommitmentConfig>,
}

#[derive(Debug, Default, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RpcBlockProductionConfigRange {
    pub first_slot: Slot,
    pub last_slot: Option<Slot>,
}

#[skip_serializing_none]
#[derive(Debug, Default, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RpcBlockProductionConfig {
    pub identity: Option<String>, // validator identity, as a base-58 encoded string
    pub range: Option<RpcBlockProductionConfigRange>, // current epoch if `None`
    #[serde(flatten)]
    pub commitment: Option<CommitmentConfig>,
}

#[skip_serializing_none]
#[derive(Debug, Default, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RpcGetVoteAccountsConfig {
    pub vote_pubkey: Option<String>, // validator vote address, as a base-58 encoded string
    #[serde(flatten)]
    pub commitment: Option<CommitmentConfig>,
    pub keep_unstaked_delinquents: Option<bool>,
    pub delinquent_slot_distance: Option<u64>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum RpcLeaderScheduleConfigWrapper {
    SlotOnly(Option<Slot>),
    ConfigOnly(Option<RpcLeaderScheduleConfig>),
}

impl RpcLeaderScheduleConfigWrapper {
    pub fn unzip(&self) -> (Option<Slot>, Option<RpcLeaderScheduleConfig>) {
        match &self {
            RpcLeaderScheduleConfigWrapper::SlotOnly(slot) => (*slot, None),
            RpcLeaderScheduleConfigWrapper::ConfigOnly(config) => (None, config.clone()),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RpcLargestAccountsFilter {
    Circulating,
    NonCirculating,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RpcLargestAccountsConfig {
    #[serde(flatten)]
    pub commitment: Option<CommitmentConfig>,
    pub filter: Option<RpcLargestAccountsFilter>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RpcSupplyConfig {
    #[serde(flatten)]
    pub commitment: Option<CommitmentConfig>,
    #[serde(default)]
    pub exclude_non_circulating_accounts_list: bool,
}

#[skip_serializing_none]
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RpcEpochConfig {
    pub epoch: Option<Epoch>,
    #[serde(flatten)]
    pub commitment: Option<CommitmentConfig>,
    pub min_context_slot: Option<Slot>,
}

#[skip_serializing_none]
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RpcAccountInfoConfig {
    pub encoding: Option<UiAccountEncoding>,
    pub data_slice: Option<UiDataSliceConfig>,
    #[serde(flatten)]
    pub commitment: Option<CommitmentConfig>,
    pub min_context_slot: Option<Slot>,
}

#[skip_serializing_none]
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RpcProgramAccountsConfig {
    pub filters: Option<Vec<RpcFilterType>>,
    #[serde(flatten)]
    pub account_config: RpcAccountInfoConfig,
    pub with_context: Option<bool>,
}

#[skip_serializing_none]
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RpcSignaturesForAddressConfig {
    pub before: Option<String>, // Signature as base-58 string
    pub until: Option<String>,  // Signature as base-58 string
    pub limit: Option<usize>,
    #[serde(flatten)]
    pub commitment: Option<CommitmentConfig>,
    pub min_context_slot: Option<Slot>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum RpcEncodingConfigWrapper<T> {
    Deprecated(Option<UiTransactionEncoding>),
    Current(Option<T>),
}

impl<T: EncodingConfig + Default + Copy> RpcEncodingConfigWrapper<T> {
    pub fn convert_to_current(&self) -> T {
        match self {
            RpcEncodingConfigWrapper::Deprecated(encoding) => T::new_with_encoding(encoding),
            RpcEncodingConfigWrapper::Current(config) => config.unwrap_or_default(),
        }
    }

    pub fn convert<U: EncodingConfig + From<T>>(&self) -> RpcEncodingConfigWrapper<U> {
        match self {
            RpcEncodingConfigWrapper::Deprecated(encoding) => {
                RpcEncodingConfigWrapper::Deprecated(*encoding)
            }
            RpcEncodingConfigWrapper::Current(config) => {
                RpcEncodingConfigWrapper::Current(config.map(|config| config.into()))
            }
        }
    }
}

pub trait EncodingConfig {
    fn new_with_encoding(encoding: &Option<UiTransactionEncoding>) -> Self;
}

#[skip_serializing_none]
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RpcBlockConfig {
    pub encoding: Option<UiTransactionEncoding>,
    pub transaction_details: Option<TransactionDetails>,
    pub rewards: Option<bool>,
    #[serde(flatten)]
    pub commitment: Option<CommitmentConfig>,
    pub max_supported_transaction_version: Option<u8>,
}

impl EncodingConfig for RpcBlockConfig {
    fn new_with_encoding(encoding: &Option<UiTransactionEncoding>) -> Self {
        Self {
            encoding: *encoding,
            ..Self::default()
        }
    }
}

impl RpcBlockConfig {
    pub fn rewards_only() -> Self {
        Self {
            transaction_details: Some(TransactionDetails::None),
            ..Self::default()
        }
    }

    pub fn rewards_with_commitment(commitment: Option<CommitmentConfig>) -> Self {
        Self {
            transaction_details: Some(TransactionDetails::None),
            commitment,
            ..Self::default()
        }
    }
}

impl From<RpcBlockConfig> for RpcEncodingConfigWrapper<RpcBlockConfig> {
    fn from(config: RpcBlockConfig) -> Self {
        RpcEncodingConfigWrapper::Current(Some(config))
    }
}

#[skip_serializing_none]
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RpcTransactionConfig {
    pub encoding: Option<UiTransactionEncoding>,
    #[serde(flatten)]
    pub commitment: Option<CommitmentConfig>,
    pub max_supported_transaction_version: Option<u8>,
}

impl EncodingConfig for RpcTransactionConfig {
    fn new_with_encoding(encoding: &Option<UiTransactionEncoding>) -> Self {
        Self {
            encoding: *encoding,
            ..Self::default()
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum RpcBlocksConfigWrapper {
    EndSlotOnly(Option<Slot>),
    CommitmentOnly(Option<CommitmentConfig>),
}

impl RpcBlocksConfigWrapper {
    pub fn unzip(&self) -> (Option<Slot>, Option<CommitmentConfig>) {
        match &self {
            RpcBlocksConfigWrapper::EndSlotOnly(end_slot) => (*end_slot, None),
            RpcBlocksConfigWrapper::CommitmentOnly(commitment) => (None, *commitment),
        }
    }
}

#[skip_serializing_none]
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RpcContextConfig {
    #[serde(flatten)]
    pub commitment: Option<CommitmentConfig>,
    pub min_context_slot: Option<Slot>,
}

#[derive(Debug, Default)]
pub struct GetConfirmedSignaturesForAddress2Config {
    pub before: Option<Signature>,
    pub until: Option<Signature>,
    pub limit: Option<usize>,
    pub commitment: Option<CommitmentConfig>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RpcTransactionLogsConfig {
    #[serde(flatten)]
    pub commitment: Option<CommitmentConfig>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RpcTransactionLogsFilter {
    All,
    AllWithVotes,
    Mentions(Vec<String>), // base58-encoded list of addresses
}

#[cfg(feature = "pubsub")]
pub mod pubsub {
    use super::*;

    #[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
    pub struct RpcAccountSubscribeConfig {
        #[serde(flatten)]
        pub commitment: Option<CommitmentConfig>,
        pub encoding: Option<UiTransactionEncoding>,
    }

    #[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub struct RpcBlockSubscribeConfig {
        #[serde(flatten)]
        pub commitment: Option<CommitmentConfig>,
        pub encoding: Option<UiTransactionEncoding>,
        pub transaction_details: Option<TransactionDetails>,
        pub show_rewards: Option<bool>,
        pub max_supported_transaction_version: Option<u8>,
    }

    #[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub enum RpcBlockSubscribeFilter {
        All,
        MentionsAccountOrProgram(String),
    }

    #[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub struct RpcSignatureSubscribeConfig {
        #[serde(flatten)]
        pub commitment: Option<CommitmentConfig>,
        pub enable_received_notification: Option<bool>,
    }
}
