use solana_sdk::commitment_config::CommitmentConfig;

use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GetBlockHeightRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<CommitmentConfig>,
}

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

impl From<GetBlockHeightRequest> for serde_json::Value {
    fn from(value: GetBlockHeightRequest) -> Self {
        match value.config {
            Some(config) => serde_json::json!([config]),
            None => serde_json::Value::Null,
        }
    }
}

impl From<GetBlockHeightRequest> for ClientRequest {
    fn from(val: GetBlockHeightRequest) -> Self {
        let mut request = ClientRequest::new("getBlockHeight");
        let params = val.into();

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

impl From<GetBlockHeightResponse> for u64 {
    fn from(value: GetBlockHeightResponse) -> Self {
        value.0
    }
}
