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

impl Into<serde_json::Value> for GetBlocksRequest {
    fn into(self) -> serde_json::Value {
        match self.config {
            Some(config) => serde_json::json!([self.start_slot, self.end_slot, config]),
            None => serde_json::json!([self.start_slot, self.end_slot]),
        }
    }
}

impl Into<ClientRequest> for GetBlocksRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getBlocks");
        let params = self.into();

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

impl Into<Vec<Slot>> for GetBlocksResponse {
    fn into(self) -> Vec<Slot> {
        self.0
    }
}
