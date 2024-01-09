use serde::Deserialize;
use solana_sdk::{clock::Slot, commitment_config::CommitmentConfig};

use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetBlocksRequest {
    pub start_slot: Slot,
    pub end_slot: Option<Slot>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<CommitmentConfig>,
}

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

impl From<GetBlocksRequest> for serde_json::Value {
    fn from(value: GetBlocksRequest) -> Self {
        match value.config {
            Some(config) => serde_json::json!([value.start_slot, value.end_slot, config]),
            None => serde_json::json!([value.start_slot, value.end_slot]),
        }
    }
}

impl From<GetBlocksRequest> for ClientRequest {
    fn from(value: GetBlocksRequest) -> Self {
        let mut request = ClientRequest::new("getBlocks");
        let params = value.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetBlocksResponse(Vec<Slot>);

impl From<ClientResponse> for GetBlocksResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl From<GetBlocksResponse> for Vec<Slot> {
    fn from(value: GetBlocksResponse) -> Self {
        value.0
    }
}
