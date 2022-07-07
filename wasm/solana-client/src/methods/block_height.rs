use solana_sdk::commitment_config::CommitmentConfig;

use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetBlockHeightRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<CommitmentConfig>,
}

impl GetBlockHeightRequest {
    pub fn new() -> Self {
        Self { config: None }
    }
    pub fn new_with_config(config: CommitmentConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

impl Into<serde_json::Value> for GetBlockHeightRequest {
    fn into(self) -> serde_json::Value {
        match self.config {
            Some(config) => serde_json::json!([config]),
            None => serde_json::Value::Null,
        }
    }
}

impl Into<ClientRequest> for GetBlockHeightRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getBlockHeight");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetBlockHeightResponse(u64);

impl From<ClientResponse> for GetBlockHeightResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl Into<u64> for GetBlockHeightResponse {
    fn into(self) -> u64 {
        self.0
    }
}
