use serde::Deserialize;
use solana_sdk::{clock::Slot, commitment_config::CommitmentConfig};

use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetBlocksWithLimitRequest {
    pub start_slot: Slot,
    pub limit: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<CommitmentConfig>,
}

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

impl From<GetBlocksWithLimitRequest> for serde_json::Value {
    fn from(value: GetBlocksWithLimitRequest) -> Self {
        match value.config {
            Some(config) => serde_json::json!([value.start_slot, value.limit, config]),
            None => serde_json::json!([value.start_slot, value.limit]),
        }
    }
}

impl From<GetBlocksWithLimitRequest> for ClientRequest {
    fn from(value: GetBlocksWithLimitRequest) -> Self {
        let mut request = ClientRequest::new("getBlocksWithLimit");
        let params = value.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetBlocksWithLimitResponse(Vec<Slot>);

impl From<ClientResponse> for GetBlocksWithLimitResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl From<GetBlocksWithLimitResponse> for Vec<Slot> {
    fn from(value: GetBlocksWithLimitResponse) -> Self {
        value.0
    }
}
