use serde_tuple::Serialize_tuple;
use serde_with::{serde_as, skip_serializing_none, DisplayFromStr};
use solana_sdk::hash::Hash;

use super::Context;
use crate::{impl_method, utils::rpc_config::RpcContextConfig, ClientRequest, ClientResponse};

#[serde_as]
#[skip_serializing_none]
#[derive(Debug, Serialize_tuple, Default)]
pub struct IsBlockhashValidRequest {
    #[serde_as(as = "DisplayFromStr")]
    blockhash: Hash,
    config: Option<RpcContextConfig>,
}

impl_method!(IsBlockhashValidRequest, "isBlockhashValid");

impl IsBlockhashValidRequest {
    pub fn new(blockhash: Hash) -> Self {
        Self {
            blockhash,
            config: None,
        }
    }
    pub fn new_with_config(blockhash: Hash, config: RpcContextConfig) -> Self {
        Self {
            blockhash,
            config: Some(config),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct IsBlockhashValidResponse {
    pub context: Context,
    pub value: bool,
}

#[cfg(test)]
mod tests {
    use std::{collections::HashMap, str::FromStr};

    use serde_json::Value;
    use solana_extra_wasm::account_decoder::UiAccountData;
    use solana_sdk::{commitment_config::CommitmentConfig, pubkey};

    use crate::{
        methods::Method, utils::rpc_response::RpcBlockProductionRange, ClientRequest,
        ClientResponse,
    };

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(IsBlockhashValidRequest::NAME)
            .id(45)
            .params(IsBlockhashValidRequest::new_with_config(
                Hash::from_str("J7rBdM6AecPDEZp8aPq5iPSNKVkU5Q76F3oAV4eW5wsW").unwrap(),
                RpcContextConfig {
                    commitment: Some(CommitmentConfig::processed()),
                    min_context_slot: None,
                },
            ));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"id":45,"jsonrpc":"2.0","method":"isBlockhashValid","params":["J7rBdM6AecPDEZp8aPq5iPSNKVkU5Q76F3oAV4eW5wsW",{"commitment":"processed"}]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json =
            r#"{"jsonrpc":"2.0","result":{"context":{"slot":2483},"value":false},"id":1}"#;

        let response: ClientResponse<IsBlockhashValidResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert!(!response.result.value);
    }
}
