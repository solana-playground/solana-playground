use solana_sdk::{
    hash::{Hash, Hasher},
    transaction::{self, MessageHash, SanitizedTransaction, Transaction, VersionedTransaction},
};

use crate::runtime::bank::PgAddressLoader;

/// Tries to convert a serialized transaction into `SanitizedTransaction`
pub fn get_sanitized_tx(serialized_tx: &[u8]) -> transaction::Result<SanitizedTransaction> {
    let tx: Transaction = serde_json::from_slice(serialized_tx).unwrap();
    let tx = VersionedTransaction::from(tx);
    SanitizedTransaction::try_create(
        tx,
        MessageHash::Compute,
        Some(false), // is_simple_vote_tx
        PgAddressLoader::default(),
        true, // require_static_program_ids
    )
}

/// Create a blockhash from the given bytes
pub fn create_blockhash(bytes: &[u8]) -> Hash {
    let mut hasher = Hasher::default();
    hasher.hash(bytes);
    hasher.result()
}
