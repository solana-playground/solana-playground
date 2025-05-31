use serde_tuple::Serialize_tuple;
use serde_with::{serde_as, skip_serializing_none, DisplayFromStr};
use solana_sdk::{commitment_config::CommitmentConfig, pubkey::Pubkey};

use super::Context;
use crate::{impl_method, ClientRequest, ClientResponse};

#[serde_as]
#[skip_serializing_none]
#[derive(Debug, Serialize_tuple)]
pub struct GetBalanceRequest {
    #[serde_as(as = "DisplayFromStr")]
    pub pubkey: Pubkey,
    pub config: Option<CommitmentConfig>,
}

impl_method!(GetBalanceRequest, "getBalance");

impl GetBalanceRequest {
    pub fn new(pubkey: Pubkey) -> Self {
        Self {
            pubkey,
            config: None,
        }
    }
    pub fn new_with_config(pubkey: Pubkey, config: CommitmentConfig) -> Self {
        Self {
            pubkey,
            config: Some(config),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetBalanceResponse {
    pub context: Context,
    pub value: u64,
}

#[cfg(test)]
mod tests {
    use serde_json::Value;
    use solana_sdk::pubkey;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let pubkey = pubkey!("83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri");
        let request = ClientRequest::new(GetBalanceRequest::NAME)
            .id(1)
            .params(GetBalanceRequest::new(pubkey));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getBalance","params":["83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri"]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":{"context":{"slot":1},"value":0},"id":1}"#;

        let response: ClientResponse<GetBalanceResponse> = serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(response.result.context.slot, 1);
        assert_eq!(response.result.value, 0);
    }
}
