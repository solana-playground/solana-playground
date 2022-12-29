use serde::{Deserialize, Serialize};
use solana_sdk::{
    clock::UnixTimestamp,
    instruction::CompiledInstruction,
    message::v0::LoadedAddresses,
    pubkey::Pubkey,
    slot_history::Slot,
    transaction::{TransactionError, VersionedTransaction},
};
use wasm_bindgen::prelude::*;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TransactionData {
    /// The slot during which the transaction was processed
    slot: Slot,
    /// The transaction
    tx: VersionedTransaction,
    /// Metadata produced from the transaction
    meta: Option<ConfirmedTransactionMeta>,
    /// The unix timestamp of when the transaction was processed
    block_time: Option<UnixTimestamp>,
}

impl TransactionData {
    pub fn new(
        slot: Slot,
        tx: VersionedTransaction,
        meta: Option<ConfirmedTransactionMeta>,
        block_time: Option<UnixTimestamp>,
    ) -> Self {
        Self {
            tx,
            slot,
            meta,
            block_time,
        }
    }

    pub fn get_slot(&self) -> Slot {
        self.slot
    }

    pub fn get_tx(&self) -> &VersionedTransaction {
        &self.tx
    }

    pub fn get_meta(&self) -> &Option<ConfirmedTransactionMeta> {
        &self.meta
    }

    pub fn get_block_time(&self) -> Option<UnixTimestamp> {
        self.block_time
    }
}

/// Metadata for a confirmed transaction on the ledger
#[wasm_bindgen]
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ConfirmedTransactionMeta {
    /// The fee charged for processing the transaction
    pub(crate) fee: u64,
    /// An array of cross program invoked instructions
    pub(crate) inner_instructions: Option<Vec<CompiledInnerInstruction>>,
    /// The balances of the transaction accounts before processing
    pub(crate) pre_balances: Vec<u64>,
    /// The balances of the transaction accounts after processing
    pub(crate) post_balances: Vec<u64>,
    /// An array of program log messages emitted during a transaction
    pub(crate) log_messages: Option<Vec<String>>,
    /// The token balances of the transaction accounts before processing
    pub(crate) pre_token_balances: Option<Vec<TokenBalance>>,
    /// The token balances of the transaction accounts after processing
    pub(crate) post_token_balances: Option<Vec<TokenBalance>>,
    /// The error result of transaction processing
    pub(crate) err: Option<TransactionError>,
    /// The collection of addresses loaded using address lookup tables
    pub(crate) loaded_addresses: Option<LoadedAddresses>,
    /// The compute units consumed after processing the transaction
    pub(crate) compute_units_consumed: Option<u64>,
}

#[wasm_bindgen]
impl ConfirmedTransactionMeta {
    pub fn fee(&self) -> u64 {
        self.fee
    }

    /// TODO:
    #[wasm_bindgen(js_name = innerInstructions)]
    pub fn inner_instructions(&self) -> Option<u8> {
        None
    }

    #[wasm_bindgen(js_name = preBalances)]
    pub fn pre_balances(&self) -> Vec<u64> {
        self.pre_balances.to_owned()
    }

    #[wasm_bindgen(js_name = postBalances)]
    pub fn post_balances(&self) -> Vec<u64> {
        self.post_balances.to_owned()
    }

    #[wasm_bindgen(js_name = logs)]
    pub fn log_messages(&self) -> Option<Vec<JsValue>> {
        self.log_messages
            .as_ref()
            .map(|logs| logs.iter().map(|log| JsValue::from_str(&log)).collect())
    }

    /// TODO:
    #[wasm_bindgen(js_name = preTokenBalances)]
    pub fn pre_token_balances(&self) -> Option<u8> {
        None
    }

    /// TODO:
    #[wasm_bindgen(js_name = postTokenBalances)]
    pub fn post_token_balances(&self) -> Option<u8> {
        None
    }

    pub fn err(&self) -> Option<String> {
        self.err.as_ref().map(|err| err.to_string())
    }

    /// TODO:
    #[wasm_bindgen(js_name = loadedAddresses)]
    pub fn loaded_addresses(&self) -> Option<u8> {
        None
    }

    #[wasm_bindgen(js_name = computeUnitsConsumed)]
    pub fn compute_units_consumed(&self) -> Option<u64> {
        self.compute_units_consumed
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CompiledInnerInstruction {
    pub index: u8,
    pub instructions: Vec<CompiledInstruction>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TokenBalance {
    pub account_index: u8,
    pub mint: Pubkey,
    pub owner: Option<Pubkey>,
    pub ui_token_amount: TokenAmount,
}

/// Token amount object which returns a token amount in different formats
/// for various client use cases.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TokenAmount {
    /// Raw amount of tokens as string ignoring decimals
    pub amount: String,
    /// Number of decimals configured for token's mint
    pub decimals: u8,
    /// Token amount as float, accounts for decimals
    pub ui_amount: Option<u64>,
    /// Token amount as string, accounts for decimals
    pub ui_amount_string: Option<String>,
}
