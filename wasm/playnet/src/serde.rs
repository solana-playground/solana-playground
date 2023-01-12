// Custom de/serializations

use std::{collections::HashMap, str::FromStr};

use serde::{
    ser::{SerializeMap, Serializer},
    Deserialize, Deserializer,
};

/// `Pubkey` is getting de/serialized as bytes but JSON keys must be strings.
/// We do the necessary conversion with custom de/serialization implementation.
pub mod bank_accounts {
    use solana_sdk::{account::Account, pubkey::Pubkey};

    use crate::runtime::bank::BankAccounts;

    use super::*;

    /// `Pubkey` as key is getting serialized as bytes by default. This function
    /// serializes `Pubkey`s as `String`s to make `serde_json::to_string` work.
    pub fn serialize<S>(accounts: &BankAccounts, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut map = serializer.serialize_map(Some(accounts.len()))?;
        for (k, v) in accounts {
            map.serialize_entry(&k.to_string(), v)?;
        }
        map.end()
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<BankAccounts, D::Error>
    where
        D: Deserializer<'de>,
    {
        let mut pubkey_hm = HashMap::new();
        let string_hm = HashMap::<String, Account>::deserialize(deserializer)?;
        for (s, acc) in string_hm {
            pubkey_hm.insert(Pubkey::from_str(&s).unwrap(), acc);
        }

        Ok(pubkey_hm)
    }
}

/// Custom de-serialize implementation for `Keypair`
pub mod bank_keypair {
    use solana_sdk::signature::Keypair;

    use super::*;

    /// `Pubkey` as key is getting serialized as bytes by default. This function
    /// serializes `Pubkey`s as `String`s to make `serde_json::to_string` work.
    pub fn serialize<S>(keypair: &Keypair, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_bytes(&keypair.to_bytes())
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<Keypair, D::Error>
    where
        D: Deserializer<'de>,
    {
        let buffer = Vec::<u8>::deserialize(deserializer)?;
        Ok(Keypair::from_bytes(&buffer).unwrap())
    }
}
