use solana_sdk::{commitment_config::CommitmentConfig, epoch_info::EpochInfo};

use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetEpochInfoRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<CommitmentConfig>,
}

impl GetEpochInfoRequest {
    pub fn new() -> Self {
        Self { config: None }
    }
    pub fn new_with_config(config: CommitmentConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

impl Into<serde_json::Value> for GetEpochInfoRequest {
    fn into(self) -> serde_json::Value {
        match self.config {
            Some(config) => serde_json::json!([config]),
            None => serde_json::json!([]),
        }
    }
}

impl Into<ClientRequest> for GetEpochInfoRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getEpochInfo");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetEpochInfoResponse(EpochInfo);

impl From<ClientResponse> for GetEpochInfoResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl Into<EpochInfo> for GetEpochInfoResponse {
    fn into(self) -> EpochInfo {
        self.0
    }
}
