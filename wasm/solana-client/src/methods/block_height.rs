use serde::Serialize;
use serde_tuple::Serialize_tuple;
use serde_with::skip_serializing_none;
use solana_sdk::commitment_config::CommitmentConfig;

use crate::{impl_method, ClientRequest, ClientResponse};

#[skip_serializing_none]
#[derive(Debug, Serialize_tuple, Default)]
pub struct GetBlockHeightRequest {
    pub config: Option<CommitmentConfig>,
}

impl_method!(GetBlockHeightRequest, "getBlockHeight");

impl GetBlockHeightRequest {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn new_with_config(config: CommitmentConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetBlockHeightResponse(u64);

impl From<GetBlockHeightResponse> for u64 {
    fn from(value: GetBlockHeightResponse) -> Self {
        value.0
    }
}

#[cfg(test)]
mod tests {
    use serde_json::Value;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetBlockHeightRequest::NAME)
            .id(1)
            .params(GetBlockHeightRequest::new());

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getBlockHeight"}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":1233,"id":1}"#;

        let response: ClientResponse<GetBlockHeightResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");

        assert_eq!(response.result.0, 1233);
    }
}
