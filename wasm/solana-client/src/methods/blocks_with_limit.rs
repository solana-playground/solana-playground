use serde::Deserialize;
use serde_tuple::Serialize_tuple;
use serde_with::skip_serializing_none;
use solana_sdk::{clock::Slot, commitment_config::CommitmentConfig};

use crate::{impl_method, ClientRequest, ClientResponse};

#[skip_serializing_none]
#[derive(Debug, Serialize_tuple)]
#[serde(rename_all = "camelCase")]
pub struct GetBlocksWithLimitRequest {
    pub start_slot: Slot,
    pub limit: usize,
    pub config: Option<CommitmentConfig>,
}

impl_method!(GetBlocksWithLimitRequest, "getBlocksWithLimit");

impl GetBlocksWithLimitRequest {
    pub fn new(start_slot: Slot, limit: usize) -> Self {
        Self {
            start_slot,
            limit,
            config: None,
        }
    }
    pub fn new_with_config(start_slot: Slot, limit: usize, config: CommitmentConfig) -> Self {
        Self {
            start_slot,
            limit,
            config: Some(config),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetBlocksWithLimitResponse(Vec<Slot>);

impl From<GetBlocksWithLimitResponse> for Vec<Slot> {
    fn from(value: GetBlocksWithLimitResponse) -> Self {
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
        let request = ClientRequest::new(GetBlocksWithLimitRequest::NAME)
            .id(1)
            .params(GetBlocksWithLimitRequest::new(5, 3));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getBlocksWithLimit","params":[5,3]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":[5,6,7],"id":1}"#;

        let response: ClientResponse<GetBlocksWithLimitResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(response.result.0, vec![5, 6, 7]);
    }
}
