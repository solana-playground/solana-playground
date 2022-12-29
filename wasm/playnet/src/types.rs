use solana_sdk::{
    account::Account,
    clock::UnixTimestamp,
    hash::Hash,
    pubkey::Pubkey,
    slot_history::Slot,
    stake_history::Epoch,
    transaction::{self, TransactionError, TransactionVersion},
    transaction_context::{TransactionAccount, TransactionReturnData},
};
use wasm_bindgen::prelude::*;

use crate::runtime::transaction_history::{ConfirmedTransactionMeta, TransactionData};

#[wasm_bindgen]
pub struct WasmAccount {
    /// Lamports in the account
    pub lamports: u64,
    /// Data held in this account
    #[wasm_bindgen(getter_with_clone)]
    pub data: Vec<u8>,
    /// The program that owns this account. If executable, the program that loads this account.
    pub owner: Pubkey,
    /// This account's data contains a loaded program (and is now read-only)
    pub executable: bool,
    /// The epoch at which this account will next owe rent
    #[wasm_bindgen(js_name = rentEpoch)]
    pub rent_epoch: Epoch,
}

impl From<Account> for WasmAccount {
    fn from(account: Account) -> Self {
        Self {
            lamports: account.lamports,
            data: account.data,
            owner: account.owner,
            executable: account.executable,
            rent_epoch: account.rent_epoch,
        }
    }
}

#[wasm_bindgen]
pub struct GetLatestBlockhashResult {
    blockhash: Hash,
    last_valid_block_height: u64,
}

impl GetLatestBlockhashResult {
    pub fn new(blockhash: Hash, last_valid_block_height: u64) -> Self {
        Self {
            blockhash,
            last_valid_block_height,
        }
    }
}

#[wasm_bindgen]
impl GetLatestBlockhashResult {
    pub fn blockhash(&self) -> String {
        self.blockhash.to_string()
    }

    #[wasm_bindgen(js_name = lastValidBlockHeight)]
    pub fn last_valid_block_height(&self) -> u64 {
        self.last_valid_block_height
    }
}

/// Return data at the end of a transaction
#[wasm_bindgen]
pub struct WasmTransactionReturnData {
    #[wasm_bindgen(js_name = programId)]
    pub program_id: Pubkey,
    #[wasm_bindgen(getter_with_clone)]
    pub data: Vec<u8>,
}

impl From<TransactionReturnData> for WasmTransactionReturnData {
    fn from(val: TransactionReturnData) -> Self {
        Self {
            data: val.data,
            program_id: val.program_id,
        }
    }
}

#[wasm_bindgen]
pub struct SimulateTransactionResult {
    pub(crate) result: transaction::Result<()>,
    pub(crate) pre_accounts: Vec<TransactionAccount>,
    pub(crate) post_accounts: Vec<TransactionAccount>,
    pub(crate) logs: Vec<String>,
    pub(crate) units_consumed: u64,
    pub(crate) return_data: Option<TransactionReturnData>,
}

impl SimulateTransactionResult {
    pub fn new(
        result: transaction::Result<()>,
        pre_accounts: Vec<TransactionAccount>,
        post_accounts: Vec<TransactionAccount>,
        logs: Vec<String>,
        units_consumed: u64,
        return_data: Option<TransactionReturnData>,
    ) -> Self {
        Self {
            result,
            pre_accounts,
            post_accounts,
            logs,
            units_consumed,
            return_data,
        }
    }

    pub fn new_error(err: transaction::TransactionError) -> Self {
        Self {
            result: Err(err),
            logs: vec![],
            pre_accounts: vec![],
            post_accounts: vec![],
            units_consumed: 0,
            return_data: None,
        }
    }
}

#[wasm_bindgen]
impl SimulateTransactionResult {
    pub fn error(&self) -> Option<String> {
        match &self.result {
            Ok(_) => None,
            Err(err) => Some(err.to_string()),
        }
    }

    pub fn logs(&self) -> Vec<JsValue> {
        self.logs.iter().map(|log| JsValue::from_str(log)).collect()
    }

    #[wasm_bindgen(js_name = unitsConsumed)]
    pub fn units_consumed(&self) -> u64 {
        self.units_consumed
    }

    #[wasm_bindgen(js_name = returnData)]
    pub fn return_data(&self) -> Option<WasmTransactionReturnData> {
        self.return_data
            .as_ref()
            .map(|tx_return_data| WasmTransactionReturnData::from(tx_return_data.to_owned()))
    }
}

#[wasm_bindgen]
pub struct SendTransactionResult {
    result: transaction::Result<String>,
}

impl SendTransactionResult {
    pub fn new(tx_hash: String) -> Self {
        Self {
            result: Ok(tx_hash),
        }
    }

    pub fn new_error(err: TransactionError) -> Self {
        Self { result: Err(err) }
    }
}

#[wasm_bindgen]
impl SendTransactionResult {
    pub fn error(&self) -> Option<String> {
        match &self.result {
            Ok(_) => None,
            Err(err) => Some(err.to_string()),
        }
    }

    #[wasm_bindgen(js_name = txHash)]
    pub fn tx_hash(&self) -> String {
        self.result.as_ref().unwrap().to_owned()
    }
}

#[wasm_bindgen]
pub struct GetSignatureStatusesResult {
    statuses: Vec<Option<TransactionStatus>>,
}

impl GetSignatureStatusesResult {
    pub fn new(statuses: Vec<Option<TransactionStatus>>) -> Self {
        Self { statuses }
    }
}

#[wasm_bindgen]
impl GetSignatureStatusesResult {
    pub fn statuses(self) -> Vec<JsValue> {
        self.statuses
            .into_iter()
            .map(|status| JsValue::from(status))
            .collect()
    }
}

#[wasm_bindgen]
pub struct TransactionStatus {
    #[wasm_bindgen(js_name = confirmationStatus)]
    pub confirmation_status: Option<WasmCommitmentLevel>,
    pub confirmations: Option<usize>,
    pub slot: Slot,
    err: Option<TransactionError>,
}

impl TransactionStatus {
    pub fn new(
        confirmation_status: Option<WasmCommitmentLevel>,
        confirmations: Option<usize>,
        slot: Slot,
        err: Option<TransactionError>,
    ) -> Self {
        Self {
            confirmation_status,
            confirmations,
            slot,
            err,
        }
    }
}

#[wasm_bindgen]
impl TransactionStatus {
    pub fn error(&self) -> Option<String> {
        self.err.as_ref().and_then(|err| Some(err.to_string()))
    }
}

#[wasm_bindgen]
pub struct GetTransactionResult {
    data: Option<TransactionData>,
}

impl GetTransactionResult {
    pub fn new(data: Option<TransactionData>) -> Self {
        Self { data }
    }
}

#[wasm_bindgen]
impl GetTransactionResult {
    /// NOTE: This method should be called before accessing any other data
    pub fn exists(&self) -> bool {
        self.data.is_some()
    }

    #[wasm_bindgen(js_name = blockTime)]
    pub fn block_time(&self) -> Option<UnixTimestamp> {
        self.data.as_ref().unwrap().get_block_time()
    }

    /// Returns the transaction version or `None` for legacy transactions
    pub fn version(&self) -> Option<u8> {
        match self.data.as_ref().unwrap().get_tx().version() {
            TransactionVersion::Legacy(_) => None,
            TransactionVersion::Number(version) => Some(version),
        }
    }

    pub fn meta(&self) -> ConfirmedTransactionMeta {
        self.data
            .as_ref()
            .unwrap()
            .get_meta()
            .as_ref()
            .unwrap()
            .clone()
    }

    /// Returns the base64 encoded tx string
    pub fn transaction(&self) -> String {
        base64::encode(bincode::serialize(&self.data.as_ref().unwrap().get_tx()).unwrap())
    }
}

#[wasm_bindgen]
#[derive(Clone, Copy)]
pub enum WasmCommitmentLevel {
    Processed,
    Confirmed,
    Finalized,
}
