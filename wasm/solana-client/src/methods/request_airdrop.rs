use serde_tuple::Serialize_tuple;
use serde_with::{serde_as, skip_serializing_none, DisplayFromStr};
use solana_sdk::{
    commitment_config::CommitmentConfig,
    {pubkey::Pubkey, signature::Signature},
};
use std::str::FromStr;

use crate::{impl_method, ClientRequest, ClientResponse};

#[serde_as]
#[skip_serializing_none]
#[derive(Debug, Serialize_tuple)]
pub struct RequestAirdropRequest {
    #[serde_as(as = "DisplayFromStr")]
    pub pubkey: Pubkey,
    pub lamports: u64,
    pub config: Option<CommitmentConfig>,
}

impl_method!(RequestAirdropRequest, "requestAirdrop");

impl RequestAirdropRequest {
    pub fn new(pubkey: Pubkey, lamports: u64) -> Self {
        Self {
            pubkey,
            lamports,
            config: None,
        }
    }
    pub fn new_with_config(pubkey: Pubkey, lamports: u64, config: CommitmentConfig) -> Self {
        Self {
            pubkey,
            lamports,
            config: Some(config),
        }
    }
}

#[serde_as]
#[derive(Debug, Deserialize)]
pub struct RequestAirdropResponse(#[serde_as(as = "DisplayFromStr")] Signature);

impl From<RequestAirdropResponse> for Signature {
    fn from(val: RequestAirdropResponse) -> Self {
        val.0
    }
}

#[cfg(test)]
mod tests {
    use std::{collections::HashMap, str::FromStr};

    use serde_json::Value;
    use solana_extra_wasm::{
        account_decoder::{UiAccount, UiAccountData, UiAccountEncoding},
        transaction_status::Encodable,
    };
    use solana_sdk::{commitment_config::CommitmentConfig, pubkey};

    use crate::{
        methods::Method,
        utils::{
            rpc_config::RpcAccountInfoConfig,
            rpc_filter::{Memcmp, MemcmpEncodedBytes, RpcFilterType},
            rpc_response::RpcBlockProductionRange,
        },
        ClientRequest, ClientResponse,
    };

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(RequestAirdropRequest::NAME)
            .id(1)
            .params(RequestAirdropRequest::new(
                pubkey!("83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri"),
                1000000000,
            ));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"requestAirdrop","params":["83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri",1000000000]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":"5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW","id":1}"#;

        let response: ClientResponse<RequestAirdropResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(response.result.0, Signature::from_str("5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW").unwrap());
    }
}
