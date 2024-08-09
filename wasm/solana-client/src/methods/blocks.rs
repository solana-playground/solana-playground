use serde::Deserialize;
use serde_tuple::Serialize_tuple;
use serde_with::skip_serializing_none;
use solana_sdk::{clock::Slot, commitment_config::CommitmentConfig};

use crate::{impl_method, ClientRequest, ClientResponse};

#[skip_serializing_none]
#[derive(Debug, Serialize_tuple)]
#[serde(rename_all = "camelCase")]
pub struct GetBlocksRequest {
    pub start_slot: Slot,
    pub end_slot: Option<Slot>,
    pub config: Option<CommitmentConfig>,
}

impl_method!(GetBlocksRequest, "getBlocks");

impl GetBlocksRequest {
    pub fn new(start_slot: Slot, end_slot: Option<Slot>) -> Self {
        Self {
            start_slot,
            end_slot,
            config: None,
        }
    }
    pub fn new_with_config(
        start_slot: Slot,
        end_slot: Option<Slot>,
        config: CommitmentConfig,
    ) -> Self {
        Self {
            start_slot,
            end_slot,
            config: Some(config),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetBlocksResponse(Vec<Slot>);

impl From<GetBlocksResponse> for Vec<Slot> {
    fn from(value: GetBlocksResponse) -> Self {
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
        let request = ClientRequest::new(GetBlocksRequest::NAME)
            .id(1)
            .params(GetBlocksRequest::new(5, Some(10)));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getBlocks","params":[5,10]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":[5,6,7,8,9,10],"id":1}"#;

        let response: ClientResponse<GetBlocksResponse> = serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(response.result.0, vec![5, 6, 7, 8, 9, 10]);
    }
}
