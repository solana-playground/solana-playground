// Since there is no networking access from WASM, all JSON-RPC methods need to be
// implemented from scratch to interact with the Playnet runtime.

use std::{
    rc::Rc,
    str::FromStr,
    sync::{RwLock, RwLockReadGuard, RwLockWriteGuard},
};

use solana_sdk::{
    feature_set::FeatureSet,
    message::{Message, SanitizedMessage},
    pubkey::Pubkey,
    signature::Signature,
    slot_history::Slot,
    transaction::{self, SanitizedTransaction},
};
use wasm_bindgen::prelude::*;

use crate::{
    runtime::bank::PgBank,
    types::{
        GetLatestBlockhashResult, GetSignatureStatusesResult, GetTransactionResult,
        SendTransactionResult, SimulateTransactionResult, TransactionStatus, WasmAccount,
        WasmCommitmentLevel,
    },
    utils::get_sanitized_tx_from_serialized_tx,
};

#[wasm_bindgen]
#[derive(Clone)]
pub struct PgRpc {
    bank: Rc<RwLock<PgBank>>,
}

impl PgRpc {
    pub fn new(bank: Rc<RwLock<PgBank>>) -> Self {
        Self { bank }
    }

    fn get_bank(&self) -> RwLockReadGuard<'_, PgBank> {
        self.bank.read().unwrap()
    }

    fn get_bank_mut(&self) -> RwLockWriteGuard<'_, PgBank> {
        self.bank.write().unwrap()
    }
}

#[wasm_bindgen]
impl PgRpc {
    #[wasm_bindgen(js_name = getAccountInfo)]
    pub fn get_account_info(&self, pubkey_str: &str) -> WasmAccount {
        WasmAccount::from(
            self.get_bank()
                .get_account_default(&Pubkey::from_str(pubkey_str).unwrap()),
        )
    }

    #[wasm_bindgen(js_name = getSlot)]
    pub fn get_slot(&self) -> Slot {
        self.get_bank().get_slot()
    }

    #[wasm_bindgen(js_name = getBlockHeight)]
    pub fn get_block_height(&self) -> u64 {
        self.get_bank().get_block_height()
    }

    #[wasm_bindgen(js_name = getGenesisHash)]
    pub fn get_genesis_hash(&self) -> String {
        self.get_bank().get_genesis_hash().to_string()
    }

    #[wasm_bindgen(js_name = getLatestBlockhash)]
    pub fn get_latest_blockhash(&self) -> GetLatestBlockhashResult {
        let bank = self.get_bank();
        GetLatestBlockhashResult::new(bank.get_latest_blockhash(), bank.get_block_height())
    }

    #[wasm_bindgen(js_name = getMinimumBalanceForRentExemption)]
    pub fn get_minimum_balance_for_rent_exemption(&self, data_len: usize) -> u64 {
        self.get_bank()
            .get_minimum_balance_for_rent_exemption(data_len)
    }

    #[wasm_bindgen(js_name = getFeeForMessage)]
    pub fn get_fee_for_message(&self, serialized_msg: &[u8]) -> Option<u64> {
        let msg: Message = serde_json::from_slice(serialized_msg).unwrap();
        self.get_bank()
            .get_fee_for_message(&SanitizedMessage::try_from(msg).unwrap())
    }

    #[wasm_bindgen(js_name = simulateTransaction)]
    pub fn simulate_transaction(&self, serialized_tx: &[u8]) -> SimulateTransactionResult {
        let sanitized_transaction = match get_sanitized_tx_from_serialized_tx(serialized_tx) {
            Ok(tx) => tx,
            Err(err) => return SimulateTransactionResult::new_error(err),
        };

        let bank = self.get_bank();
        bank.simulate_tx(&sanitized_transaction)
    }

    #[wasm_bindgen(js_name = sendTransaction)]
    pub fn send_transaction(&self, serialized_tx: &[u8]) -> SendTransactionResult {
        let sanitized_tx = match get_sanitized_tx_from_serialized_tx(serialized_tx) {
            Ok(sanitized_tx) => sanitized_tx,
            Err(err) => return SendTransactionResult::new_error(err),
        };

        fn verify_transaction(
            transaction: &SanitizedTransaction,
            feature_set: &FeatureSet,
        ) -> transaction::Result<()> {
            transaction.verify()?;
            transaction.verify_precompiles(feature_set)?;
            Ok(())
        }

        let mut bank = self.get_bank_mut();
        if let Err(err) = verify_transaction(&sanitized_tx, &bank.feature_set()) {
            return SendTransactionResult::new_error(err);
        }

        match bank.process_tx(sanitized_tx) {
            Ok(tx_hash) => SendTransactionResult::new(tx_hash.to_string()),
            Err(err) => SendTransactionResult::new_error(err),
        }
    }

    #[wasm_bindgen(js_name = getSignatureStatuses)]
    pub fn get_signature_statuses(&self, signatures: Vec<JsValue>) -> GetSignatureStatusesResult {
        let bank = self.get_bank();
        let statuses = signatures
            .iter()
            .map(|js_signature| {
                let signature = Signature::from_str(&js_signature.as_string().unwrap()).unwrap();
                bank.get_tx(&signature).and_then(|tx_data| {
                    let current_slot = bank.get_slot();
                    let confirmations = current_slot - tx_data.get_slot();
                    let confirmation_status = if confirmations == 0 {
                        WasmCommitmentLevel::Processed
                    } else if confirmations < 32 {
                        WasmCommitmentLevel::Confirmed
                    } else {
                        WasmCommitmentLevel::Finalized
                    };
                    let err = tx_data
                        .get_meta()
                        .as_ref()
                        .map(|meta| meta.err.clone())
                        .unwrap_or(None);

                    Some(TransactionStatus::new(
                        Some(confirmation_status),
                        Some(confirmations as usize),
                        tx_data.get_slot(),
                        err,
                    ))
                })
            })
            .collect();

        GetSignatureStatusesResult::new(statuses)
    }

    #[wasm_bindgen(js_name = getTransaction)]
    pub fn get_transaction(&self, signature_str: &str) -> GetTransactionResult {
        let signature = Signature::from_str(signature_str).unwrap();
        GetTransactionResult::new(
            self.get_bank()
                .get_tx(&signature)
                .map(|data| data.to_owned()),
        )
    }

    #[wasm_bindgen(js_name = requestAirdrop)]
    pub fn request_airdrop(&self, pubkey_str: &str, lamports: u64) -> SendTransactionResult {
        let pubkey = Pubkey::from_str(pubkey_str).unwrap();
        match self.get_bank_mut().airdrop(&pubkey, lamports) {
            Ok(tx_hash) => SendTransactionResult::new(tx_hash.to_string()),
            Err(e) => SendTransactionResult::new_error(e),
        }
    }
}
