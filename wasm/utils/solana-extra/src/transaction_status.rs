use std::fmt;

use serde_json::Value;
use solana_sdk::{
    clock::{Slot, UnixTimestamp},
    instruction::CompiledInstruction,
    message::{
        v0::{self, LoadedAddresses, LoadedMessage, MessageAddressTableLookup},
        AccountKeys, Message, MessageHeader, VersionedMessage,
    },
    transaction::{
        Result as TransactionResult, TransactionError, TransactionVersion, VersionedTransaction,
    },
    transaction_context::TransactionReturnData,
};
use thiserror::Error;

use crate::{account_decoder::parse_token::UiTokenAmount, runtime::RewardType};

#[derive(Serialize, Deserialize, Clone, Copy, Debug, Eq, Hash, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum TransactionBinaryEncoding {
    Base58,
    Base64,
}

#[derive(Serialize, Deserialize, Clone, Copy, Debug, Eq, Hash, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum UiTransactionEncoding {
    Binary, // Legacy. Retained for RPC backwards compatibility
    Base64,
    Base58,
    Json,
    JsonParsed,
}

impl UiTransactionEncoding {
    pub fn into_binary_encoding(&self) -> Option<TransactionBinaryEncoding> {
        match self {
            Self::Binary | Self::Base58 => Some(TransactionBinaryEncoding::Base58),
            Self::Base64 => Some(TransactionBinaryEncoding::Base64),
            _ => None,
        }
    }
}

impl fmt::Display for UiTransactionEncoding {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let v = serde_json::to_value(self).map_err(|_| fmt::Error)?;
        let s = v.as_str().ok_or(fmt::Error)?;
        write!(f, "{}", s)
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ParsedAccount {
    pub pubkey: String,
    pub writable: bool,
    pub signer: bool,
}

/// A duplicate representation of a Transaction for pretty JSON serialization
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UiTransaction {
    pub signatures: Vec<String>,
    pub message: UiMessage,
}

/// A duplicate representation of a CompiledInstruction for pretty JSON serialization
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UiCompiledInstruction {
    pub program_id_index: u8,
    pub accounts: Vec<u8>,
    pub data: String,
}

impl From<&CompiledInstruction> for UiCompiledInstruction {
    fn from(instruction: &CompiledInstruction) -> Self {
        Self {
            program_id_index: instruction.program_id_index,
            accounts: instruction.accounts.clone(),
            data: bs58::encode(instruction.data.clone()).into_string(),
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ParsedInstruction {
    pub program: String,
    pub program_id: String,
    pub parsed: Value,
}

/// A partially decoded CompiledInstruction that includes explicit account addresses
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UiPartiallyDecodedInstruction {
    pub program_id: String,
    pub accounts: Vec<String>,
    pub data: String,
}

impl UiPartiallyDecodedInstruction {
    fn from(instruction: &CompiledInstruction, account_keys: &AccountKeys) -> Self {
        Self {
            program_id: account_keys[instruction.program_id_index as usize].to_string(),
            accounts: instruction
                .accounts
                .iter()
                .map(|&i| account_keys[i as usize].to_string())
                .collect(),
            data: bs58::encode(instruction.data.clone()).into_string(),
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", untagged)]
pub enum UiParsedInstruction {
    Parsed(ParsedInstruction),
    PartiallyDecoded(UiPartiallyDecodedInstruction),
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum ParsableProgram {
    SplAssociatedTokenAccount,
    SplMemo,
    SplToken,
    BpfLoader,
    BpfUpgradeableLoader,
    Stake,
    System,
    Vote,
}

#[derive(Error, Debug)]
pub enum ParseInstructionError {
    #[error("{0:?} instruction not parsable")]
    InstructionNotParsable(ParsableProgram),

    #[error("{0:?} instruction key mismatch")]
    InstructionKeyMismatch(ParsableProgram),

    #[error("Program not parsable")]
    ProgramNotParsable,

    #[error("Internal error, please report")]
    SerdeJsonError(#[from] serde_json::error::Error),
}

// TODO:
// lazy_static! {
//     static ref ASSOCIATED_TOKEN_PROGRAM_ID: Pubkey = spl_associated_token_id();
//     static ref BPF_LOADER_PROGRAM_ID: Pubkey = solana_sdk::bpf_loader::id();
//     static ref BPF_UPGRADEABLE_LOADER_PROGRAM_ID: Pubkey = solana_sdk::bpf_loader_upgradeable::id();
//     static ref MEMO_V1_PROGRAM_ID: Pubkey = spl_memo_id_v1();
//     static ref MEMO_V3_PROGRAM_ID: Pubkey = spl_memo_id_v3();
//     static ref STAKE_PROGRAM_ID: Pubkey = stake::program::id();
//     static ref SYSTEM_PROGRAM_ID: Pubkey = system_program::id();
//     static ref VOTE_PROGRAM_ID: Pubkey = solana_vote_program::id();
//     static ref PARSABLE_PROGRAM_IDS: HashMap<Pubkey, ParsableProgram> = {
//         let mut m = HashMap::new();
//         m.insert(
//             *ASSOCIATED_TOKEN_PROGRAM_ID,
//             ParsableProgram::SplAssociatedTokenAccount,
//         );
//         m.insert(*MEMO_V1_PROGRAM_ID, ParsableProgram::SplMemo);
//         m.insert(*MEMO_V3_PROGRAM_ID, ParsableProgram::SplMemo);
//         for spl_token_id in spl_token_ids() {
//             m.insert(spl_token_id, ParsableProgram::SplToken);
//         }
//         m.insert(*BPF_LOADER_PROGRAM_ID, ParsableProgram::BpfLoader);
//         m.insert(
//             *BPF_UPGRADEABLE_LOADER_PROGRAM_ID,
//             ParsableProgram::BpfUpgradeableLoader,
//         );
//         m.insert(*STAKE_PROGRAM_ID, ParsableProgram::Stake);
//         m.insert(*SYSTEM_PROGRAM_ID, ParsableProgram::System);
//         m.insert(*VOTE_PROGRAM_ID, ParsableProgram::Vote);
//         m
//     };
// }

// pub fn parse(
//     program_id: &Pubkey,
//     instruction: &CompiledInstruction,
//     account_keys: &AccountKeys,
// ) -> Result<ParsedInstruction, ParseInstructionError> {
//     let program_name = PARSABLE_PROGRAM_IDS
//         .get(program_id)
//         .ok_or(ParseInstructionError::ProgramNotParsable)?;
//     let parsed_json = match program_name {
//         ParsableProgram::SplAssociatedTokenAccount => {
//             serde_json::to_value(parse_associated_token(instruction, account_keys)?)?
//         }
//         ParsableProgram::SplMemo => parse_memo(instruction)?,
//         ParsableProgram::SplToken => serde_json::to_value(parse_token(instruction, account_keys)?)?,
//         ParsableProgram::BpfLoader => {
//             serde_json::to_value(parse_bpf_loader(instruction, account_keys)?)?
//         }
//         ParsableProgram::BpfUpgradeableLoader => {
//             serde_json::to_value(parse_bpf_upgradeable_loader(instruction, account_keys)?)?
//         }
//         ParsableProgram::Stake => serde_json::to_value(parse_stake(instruction, account_keys)?)?,
//         ParsableProgram::System => serde_json::to_value(parse_system(instruction, account_keys)?)?,
//         ParsableProgram::Vote => serde_json::to_value(parse_vote(instruction, account_keys)?)?,
//     };
//     Ok(ParsedInstruction {
//         program: format!("{:?}", program_name).to_kebab_case(),
//         program_id: program_id.to_string(),
//         parsed: parsed_json,
//     })
// }

/// A duplicate representation of an Instruction for pretty JSON serialization
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", untagged)]
pub enum UiInstruction {
    Compiled(UiCompiledInstruction),
    Parsed(UiParsedInstruction),
}

impl UiInstruction {
    fn parse(instruction: &CompiledInstruction, account_keys: &AccountKeys) -> Self {
        // TODO:
        // let program_id = &account_keys[instruction.program_id_index as usize];
        // if let Ok(parsed_instruction) = parse(program_id, instruction, account_keys) {
        //     UiInstruction::Parsed(UiParsedInstruction::Parsed(parsed_instruction))
        // } else {
        //     UiInstruction::Parsed(UiParsedInstruction::PartiallyDecoded(
        //         UiPartiallyDecodedInstruction::from(instruction, account_keys),
        //     ))
        // }

        UiInstruction::Parsed(UiParsedInstruction::PartiallyDecoded(
            UiPartiallyDecodedInstruction::from(instruction, account_keys),
        ))
    }
}

/// A duplicate representation of a MessageAddressTableLookup, in raw format, for pretty JSON serialization
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UiAddressTableLookup {
    pub account_key: String,
    pub writable_indexes: Vec<u8>,
    pub readonly_indexes: Vec<u8>,
}

impl From<&MessageAddressTableLookup> for UiAddressTableLookup {
    fn from(lookup: &MessageAddressTableLookup) -> Self {
        Self {
            account_key: lookup.account_key.to_string(),
            writable_indexes: lookup.writable_indexes.clone(),
            readonly_indexes: lookup.readonly_indexes.clone(),
        }
    }
}

/// A duplicate representation of a Message, in parsed format, for pretty JSON serialization
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UiParsedMessage {
    pub account_keys: Vec<ParsedAccount>,
    pub recent_blockhash: String,
    pub instructions: Vec<UiInstruction>,
    pub address_table_lookups: Option<Vec<UiAddressTableLookup>>,
}

/// A duplicate representation of a Message, in raw format, for pretty JSON serialization
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UiRawMessage {
    pub header: MessageHeader,
    pub account_keys: Vec<String>,
    pub recent_blockhash: String,
    pub instructions: Vec<UiCompiledInstruction>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub address_table_lookups: Option<Vec<UiAddressTableLookup>>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", untagged)]
pub enum UiMessage {
    Parsed(UiParsedMessage),
    Raw(UiRawMessage),
}

#[derive(Clone, Debug, PartialEq)]
pub struct TransactionStatusMeta {
    pub status: TransactionResult<()>,
    pub fee: u64,
    pub pre_balances: Vec<u64>,
    pub post_balances: Vec<u64>,
    pub inner_instructions: Option<Vec<InnerInstructions>>,
    pub log_messages: Option<Vec<String>>,
    pub pre_token_balances: Option<Vec<TransactionTokenBalance>>,
    pub post_token_balances: Option<Vec<TransactionTokenBalance>>,
    pub rewards: Option<Rewards>,
    pub loaded_addresses: LoadedAddresses,
    pub return_data: Option<TransactionReturnData>,
}

impl Default for TransactionStatusMeta {
    fn default() -> Self {
        Self {
            status: Ok(()),
            fee: 0,
            pre_balances: vec![],
            post_balances: vec![],
            inner_instructions: None,
            log_messages: None,
            pre_token_balances: None,
            post_token_balances: None,
            rewards: None,
            loaded_addresses: LoadedAddresses::default(),
            return_data: None,
        }
    }
}

pub fn parse_accounts(message: &Message) -> Vec<ParsedAccount> {
    let mut accounts: Vec<ParsedAccount> = vec![];
    for (i, account_key) in message.account_keys.iter().enumerate() {
        accounts.push(ParsedAccount {
            pubkey: account_key.to_string(),
            writable: message.is_writable(i),
            signer: message.is_signer(i),
        });
    }
    accounts
}

pub fn parse_static_accounts(message: &LoadedMessage) -> Vec<ParsedAccount> {
    let mut accounts: Vec<ParsedAccount> = vec![];
    for (i, account_key) in message.static_account_keys().iter().enumerate() {
        accounts.push(ParsedAccount {
            pubkey: account_key.to_string(),
            writable: message.is_writable(i),
            signer: message.is_signer(i),
        });
    }
    accounts
}

/// Represents types that can be encoded into one of several encoding formats
pub trait Encodable {
    type Encoded;
    fn encode(&self, encoding: UiTransactionEncoding) -> Self::Encoded;
}

impl Encodable for Message {
    type Encoded = UiMessage;
    fn encode(&self, encoding: UiTransactionEncoding) -> Self::Encoded {
        if encoding == UiTransactionEncoding::JsonParsed {
            let account_keys = AccountKeys::new(&self.account_keys, None);
            UiMessage::Parsed(UiParsedMessage {
                account_keys: parse_accounts(self),
                recent_blockhash: self.recent_blockhash.to_string(),
                instructions: self
                    .instructions
                    .iter()
                    .map(|instruction| UiInstruction::parse(instruction, &account_keys))
                    .collect(),
                address_table_lookups: None,
            })
        } else {
            UiMessage::Raw(UiRawMessage {
                header: self.header,
                account_keys: self.account_keys.iter().map(ToString::to_string).collect(),
                recent_blockhash: self.recent_blockhash.to_string(),
                instructions: self.instructions.iter().map(Into::into).collect(),
                address_table_lookups: None,
            })
        }
    }
}

impl EncodableWithMeta for v0::Message {
    type Encoded = UiMessage;
    fn encode_with_meta(
        &self,
        encoding: UiTransactionEncoding,
        meta: &TransactionStatusMeta,
    ) -> Self::Encoded {
        if encoding == UiTransactionEncoding::JsonParsed {
            let account_keys = AccountKeys::new(&self.account_keys, Some(&meta.loaded_addresses));
            let loaded_message = LoadedMessage::new_borrowed(self, &meta.loaded_addresses);
            UiMessage::Parsed(UiParsedMessage {
                account_keys: parse_static_accounts(&loaded_message),
                recent_blockhash: self.recent_blockhash.to_string(),
                instructions: self
                    .instructions
                    .iter()
                    .map(|instruction| UiInstruction::parse(instruction, &account_keys))
                    .collect(),
                address_table_lookups: Some(
                    self.address_table_lookups.iter().map(Into::into).collect(),
                ),
            })
        } else {
            self.json_encode()
        }
    }
    fn json_encode(&self) -> Self::Encoded {
        UiMessage::Raw(UiRawMessage {
            header: self.header,
            account_keys: self.account_keys.iter().map(ToString::to_string).collect(),
            recent_blockhash: self.recent_blockhash.to_string(),
            instructions: self.instructions.iter().map(Into::into).collect(),
            address_table_lookups: Some(
                self.address_table_lookups.iter().map(Into::into).collect(),
            ),
        })
    }
}

/// Represents types that can be encoded into one of several encoding formats
pub trait EncodableWithMeta {
    type Encoded;
    fn encode_with_meta(
        &self,
        encoding: UiTransactionEncoding,
        meta: &TransactionStatusMeta,
    ) -> Self::Encoded;
    fn json_encode(&self) -> Self::Encoded;
}

impl EncodableWithMeta for VersionedTransaction {
    type Encoded = EncodedTransaction;
    fn encode_with_meta(
        &self,
        encoding: UiTransactionEncoding,
        meta: &TransactionStatusMeta,
    ) -> Self::Encoded {
        match encoding {
            UiTransactionEncoding::Binary => EncodedTransaction::LegacyBinary(
                bs58::encode(bincode::serialize(self).unwrap()).into_string(),
            ),
            UiTransactionEncoding::Base58 => EncodedTransaction::Binary(
                bs58::encode(bincode::serialize(self).unwrap()).into_string(),
                TransactionBinaryEncoding::Base58,
            ),
            UiTransactionEncoding::Base64 => EncodedTransaction::Binary(
                base64::encode(bincode::serialize(self).unwrap()),
                TransactionBinaryEncoding::Base64,
            ),
            UiTransactionEncoding::Json => self.json_encode(),
            UiTransactionEncoding::JsonParsed => EncodedTransaction::Json(UiTransaction {
                signatures: self.signatures.iter().map(ToString::to_string).collect(),
                message: match &self.message {
                    VersionedMessage::Legacy(message) => {
                        message.encode(UiTransactionEncoding::JsonParsed)
                    }
                    VersionedMessage::V0(message) => {
                        message.encode_with_meta(UiTransactionEncoding::JsonParsed, meta)
                    }
                },
            }),
        }
    }
    fn json_encode(&self) -> Self::Encoded {
        EncodedTransaction::Json(UiTransaction {
            signatures: self.signatures.iter().map(ToString::to_string).collect(),
            message: match &self.message {
                VersionedMessage::Legacy(message) => message.encode(UiTransactionEncoding::Json),
                VersionedMessage::V0(message) => message.json_encode(),
            },
        })
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", untagged)]
pub enum EncodedTransaction {
    LegacyBinary(String), // Old way of expressing base-58, retained for RPC backwards compatibility
    Binary(String, TransactionBinaryEncoding),
    Json(UiTransaction),
}

impl EncodedTransaction {
    pub fn decode(&self) -> Option<VersionedTransaction> {
        let (blob, encoding) = match self {
            Self::Json(_) => return None,
            Self::LegacyBinary(blob) => (blob, TransactionBinaryEncoding::Base58),
            Self::Binary(blob, encoding) => (blob, *encoding),
        };

        let transaction: Option<VersionedTransaction> = match encoding {
            TransactionBinaryEncoding::Base58 => bs58::decode(blob)
                .into_vec()
                .ok()
                .and_then(|bytes| bincode::deserialize(&bytes).ok()),
            TransactionBinaryEncoding::Base64 => base64::decode(blob)
                .ok()
                .and_then(|bytes| bincode::deserialize(&bytes).ok()),
        };

        transaction.filter(|transaction| transaction.sanitize().is_ok())
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Reward {
    pub pubkey: String,
    pub lamports: i64,
    pub post_balance: u64, // Account balance in lamports after `lamports` was applied
    pub reward_type: Option<RewardType>,
    pub commission: Option<u8>, // Vote account commission when the reward was credited, only present for voting and staking rewards
}

pub type Rewards = Vec<Reward>;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct InnerInstructions {
    /// Transaction instruction index
    pub index: u8,
    /// List of inner instructions
    pub instructions: Vec<CompiledInstruction>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UiInnerInstructions {
    /// Transaction instruction index
    pub index: u8,
    /// List of inner instructions
    pub instructions: Vec<UiInstruction>,
}

impl UiInnerInstructions {
    fn parse(inner_instructions: InnerInstructions, account_keys: &AccountKeys) -> Self {
        Self {
            index: inner_instructions.index,
            instructions: inner_instructions
                .instructions
                .iter()
                .map(|ix| UiInstruction::parse(ix, account_keys))
                .collect(),
        }
    }
}

impl From<InnerInstructions> for UiInnerInstructions {
    fn from(inner_instructions: InnerInstructions) -> Self {
        Self {
            index: inner_instructions.index,
            instructions: inner_instructions
                .instructions
                .iter()
                .map(|ix| UiInstruction::Compiled(ix.into()))
                .collect(),
        }
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct TransactionTokenBalance {
    pub account_index: u8,
    pub mint: String,
    pub ui_token_amount: UiTokenAmount,
    pub owner: String,
    pub program_id: String,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UiTransactionTokenBalance {
    pub account_index: u8,
    pub mint: String,
    pub ui_token_amount: UiTokenAmount,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub owner: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub program_id: Option<String>,
}

impl From<TransactionTokenBalance> for UiTransactionTokenBalance {
    fn from(token_balance: TransactionTokenBalance) -> Self {
        Self {
            account_index: token_balance.account_index,
            mint: token_balance.mint,
            ui_token_amount: token_balance.ui_token_amount,
            owner: if !token_balance.owner.is_empty() {
                Some(token_balance.owner)
            } else {
                None
            },
            program_id: if !token_balance.program_id.is_empty() {
                Some(token_balance.program_id)
            } else {
                None
            },
        }
    }
}

/// A duplicate representation of LoadedAddresses
#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UiLoadedAddresses {
    pub writable: Vec<String>,
    pub readonly: Vec<String>,
}

impl From<&LoadedAddresses> for UiLoadedAddresses {
    fn from(loaded_addresses: &LoadedAddresses) -> Self {
        Self {
            writable: loaded_addresses
                .writable
                .iter()
                .map(ToString::to_string)
                .collect(),
            readonly: loaded_addresses
                .readonly
                .iter()
                .map(ToString::to_string)
                .collect(),
        }
    }
}

/// A duplicate representation of TransactionStatusMeta with `err` field
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UiTransactionStatusMeta {
    pub err: Option<TransactionError>,
    pub status: TransactionResult<()>, // This field is deprecated.  See https://github.com/solana-labs/solana/issues/9302
    pub fee: u64,
    pub pre_balances: Vec<u64>,
    pub post_balances: Vec<u64>,
    pub inner_instructions: Option<Vec<UiInnerInstructions>>,
    pub log_messages: Option<Vec<String>>,
    pub pre_token_balances: Option<Vec<UiTransactionTokenBalance>>,
    pub post_token_balances: Option<Vec<UiTransactionTokenBalance>>,
    pub rewards: Option<Rewards>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub loaded_addresses: Option<UiLoadedAddresses>,
    pub return_data: Option<TransactionReturnData>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EncodedTransactionWithStatusMeta {
    pub transaction: EncodedTransaction,
    pub meta: Option<UiTransactionStatusMeta>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub version: Option<TransactionVersion>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EncodedConfirmedTransactionWithStatusMeta {
    pub slot: Slot,
    #[serde(flatten)]
    pub transaction: EncodedTransactionWithStatusMeta,
    pub block_time: Option<UnixTimestamp>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum TransactionConfirmationStatus {
    Processed,
    Confirmed,
    Finalized,
}

#[derive(Debug, Clone, Copy, Eq, Hash, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum TransactionDetails {
    Full,
    Signatures,
    None,
}

impl Default for TransactionDetails {
    fn default() -> Self {
        Self::Full
    }
}

#[derive(Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EncodedConfirmedBlock {
    pub previous_blockhash: String,
    pub blockhash: String,
    pub parent_slot: Slot,
    pub transactions: Vec<EncodedTransactionWithStatusMeta>,
    pub rewards: Rewards,
    pub block_time: Option<UnixTimestamp>,
    pub block_height: Option<u64>,
}

impl From<UiConfirmedBlock> for EncodedConfirmedBlock {
    fn from(block: UiConfirmedBlock) -> Self {
        Self {
            previous_blockhash: block.previous_blockhash,
            blockhash: block.blockhash,
            parent_slot: block.parent_slot,
            transactions: block.transactions.unwrap_or_default(),
            rewards: block.rewards.unwrap_or_default(),
            block_time: block.block_time,
            block_height: block.block_height,
        }
    }
}

#[derive(Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UiConfirmedBlock {
    pub previous_blockhash: String,
    pub blockhash: String,
    pub parent_slot: Slot,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub transactions: Option<Vec<EncodedTransactionWithStatusMeta>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub signatures: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub rewards: Option<Rewards>,
    pub block_time: Option<UnixTimestamp>,
    pub block_height: Option<u64>,
}
