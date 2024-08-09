use serde_with::{serde_as, skip_serializing_none, DisplayFromStr};
use solana_extra_wasm::program::spl_token_2022::{
    generic_token_account::GenericTokenAccount, state::Account,
};
use solana_sdk::{
    account::{AccountSharedData, ReadableAccount},
    pubkey::Pubkey,
};
use std::borrow::Cow;
use thiserror::Error;

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", untagged)]
pub enum MemcmpEncodedBytes {
    #[deprecated(
        since = "1.8.1",
        note = "Please use MemcmpEncodedBytes::Base58 instead"
    )]
    Binary(String),
    Base58(String),
    Base64(String),
    Bytes(Vec<u8>),
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum MemcmpEncoding {
    Binary,
}

#[skip_serializing_none]
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Memcmp {
    /// Data offset to begin match
    pub offset: usize,
    /// Bytes, encoded with specified encoding, or default Binary
    pub bytes: MemcmpEncodedBytes,
    /// Optional encoding specification
    pub encoding: Option<MemcmpEncoding>,
}

impl Memcmp {
    pub fn bytes(&self) -> Option<Cow<Vec<u8>>> {
        use MemcmpEncodedBytes::*;
        match &self.bytes {
            Binary(bytes) | Base58(bytes) => bs58::decode(bytes).into_vec().ok().map(Cow::Owned),
            Base64(bytes) => base64::decode(bytes).ok().map(Cow::Owned),
            Bytes(bytes) => Some(Cow::Borrowed(bytes)),
        }
    }

    pub fn bytes_match(&self, data: &[u8]) -> bool {
        match self.bytes() {
            Some(bytes) => {
                if self.offset > data.len() {
                    return false;
                }
                if data[self.offset..].len() < bytes.len() {
                    return false;
                }
                data[self.offset..self.offset + bytes.len()] == bytes[..]
            }
            None => false,
        }
    }
}

const MAX_DATA_SIZE: usize = 128;
const MAX_DATA_BASE58_SIZE: usize = 175;
const MAX_DATA_BASE64_SIZE: usize = 172;

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RpcFilterType {
    DataSize(u64),
    Memcmp(Memcmp),
    TokenAccountState,
}

impl RpcFilterType {
    pub fn verify(&self) -> Result<(), RpcFilterError> {
        match self {
            RpcFilterType::DataSize(_) => Ok(()),
            RpcFilterType::Memcmp(compare) => {
                let encoding = compare.encoding.as_ref().unwrap_or(&MemcmpEncoding::Binary);
                match encoding {
                    MemcmpEncoding::Binary => {
                        use MemcmpEncodedBytes::*;
                        match &compare.bytes {
                            // DEPRECATED
                            Binary(bytes) => {
                                if bytes.len() > MAX_DATA_BASE58_SIZE {
                                    return Err(RpcFilterError::Base58DataTooLarge);
                                }
                                let bytes = bs58::decode(&bytes)
                                    .into_vec()
                                    .map_err(RpcFilterError::DecodeError)?;
                                if bytes.len() > MAX_DATA_SIZE {
                                    Err(RpcFilterError::Base58DataTooLarge)
                                } else {
                                    Ok(())
                                }
                            }
                            Base58(bytes) => {
                                if bytes.len() > MAX_DATA_BASE58_SIZE {
                                    return Err(RpcFilterError::DataTooLarge);
                                }
                                let bytes = bs58::decode(&bytes).into_vec()?;
                                if bytes.len() > MAX_DATA_SIZE {
                                    Err(RpcFilterError::DataTooLarge)
                                } else {
                                    Ok(())
                                }
                            }
                            Base64(bytes) => {
                                if bytes.len() > MAX_DATA_BASE64_SIZE {
                                    return Err(RpcFilterError::DataTooLarge);
                                }
                                let bytes = base64::decode(bytes)?;
                                if bytes.len() > MAX_DATA_SIZE {
                                    Err(RpcFilterError::DataTooLarge)
                                } else {
                                    Ok(())
                                }
                            }
                            Bytes(bytes) => {
                                if bytes.len() > MAX_DATA_SIZE {
                                    return Err(RpcFilterError::DataTooLarge);
                                }
                                Ok(())
                            }
                        }
                    }
                }
            }
            RpcFilterType::TokenAccountState => Ok(()),
        }
    }

    pub fn allows(&self, account: &AccountSharedData) -> bool {
        match self {
            RpcFilterType::DataSize(size) => account.data().len() as u64 == *size,
            RpcFilterType::Memcmp(compare) => compare.bytes_match(account.data()),
            RpcFilterType::TokenAccountState => Account::valid_account_data(account.data()),
        }
    }
}

#[derive(Error, PartialEq, Eq, Debug)]
pub enum RpcFilterError {
    #[error("encoded binary data should be less than 129 bytes")]
    DataTooLarge,
    #[deprecated(
        since = "1.8.1",
        note = "Error for MemcmpEncodedBytes::Binary which is deprecated"
    )]
    #[error("encoded binary (base 58) data should be less than 129 bytes")]
    Base58DataTooLarge,
    #[deprecated(
        since = "1.8.1",
        note = "Error for MemcmpEncodedBytes::Binary which is deprecated"
    )]
    #[error("bs58 decode error")]
    DecodeError(bs58::decode::Error),
    #[error("base58 decode error")]
    Base58DecodeError(#[from] bs58::decode::Error),
    #[error("base64 decode error")]
    Base64DecodeError(#[from] base64::DecodeError),
}

#[serde_as]
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RpcTokenAccountsFilter {
    Mint(#[serde_as(as = "DisplayFromStr")] Pubkey),
    ProgramId(#[serde_as(as = "DisplayFromStr")] Pubkey),
}
