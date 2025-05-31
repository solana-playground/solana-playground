use serde_tuple::Serialize_tuple;
use serde_with::skip_serializing_none;

use super::Context;
use crate::{
    impl_method,
    utils::{rpc_config::RpcSupplyConfig, rpc_response::RpcSupply},
    ClientRequest, ClientResponse,
};

#[skip_serializing_none]
#[derive(Debug, Serialize_tuple, Default)]
pub struct GetSupplyRequest {
    config: Option<RpcSupplyConfig>,
}

impl_method!(GetSupplyRequest, "getSupply");

impl GetSupplyRequest {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn new_with_config(config: RpcSupplyConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetSupplyResponse {
    pub context: Context,
    pub value: RpcSupply,
}

#[cfg(test)]
mod tests {
    use serde_json::Value;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetSupplyRequest::NAME)
            .id(1)
            .params(GetSupplyRequest::new());

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0", "id":1, "method":"getSupply"}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":{"context":{"slot":1114},"value":{"circulating":16000,"nonCirculating":1000000,"nonCirculatingAccounts":["FEy8pTbP5fEoqMV1GdTz83byuA8EKByqYat1PKDgVAq5","9huDUZfxoJ7wGMTffUE7vh1xePqef7gyrLJu9NApncqA","3mi1GmwEE3zo2jmfDuzvjSX9ovRXsDUKHvsntpkhuLJ9","BYxEJTDerkaRWBem3XgnVcdhppktBXa2HbkHPKj2Ui4Z"],"total":1016000}},"id":1}"#;

        let response: ClientResponse<GetSupplyResponse> = serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(response.result.context.slot, 1114);
        assert_eq!(
            response.result.value,
            RpcSupply {
                circulating: 16000,
                non_circulating: 1000000,
                total: 1016000,
                non_circulating_accounts: vec![
                    "FEy8pTbP5fEoqMV1GdTz83byuA8EKByqYat1PKDgVAq5".to_string(),
                    "9huDUZfxoJ7wGMTffUE7vh1xePqef7gyrLJu9NApncqA".to_string(),
                    "3mi1GmwEE3zo2jmfDuzvjSX9ovRXsDUKHvsntpkhuLJ9".to_string(),
                    "BYxEJTDerkaRWBem3XgnVcdhppktBXa2HbkHPKj2Ui4Z".to_string()
                ]
            }
        );
    }
}
