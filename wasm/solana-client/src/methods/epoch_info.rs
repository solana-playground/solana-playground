use solana_sdk::{commitment_config::CommitmentConfig, epoch_info::EpochInfo};

use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GetEpochInfoRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<CommitmentConfig>,
}

impl GetEpochInfoRequest {
    pub fn new() -> Self {
        Self::default()
    }
    pub fn new_with_config(config: CommitmentConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

impl From<GetEpochInfoRequest> for serde_json::Value {
    fn from(value: GetEpochInfoRequest) -> Self {
        match value.config {
            Some(config) => serde_json::json!([config]),
            None => serde_json::json!([]),
        }
    }
}

impl From<GetEpochInfoRequest> for ClientRequest {
    fn from(value: GetEpochInfoRequest) -> Self {
        let mut request = ClientRequest::new("getEpochInfo");
        let params = value.into();

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

impl From<GetEpochInfoResponse> for EpochInfo {
    fn from(value: GetEpochInfoResponse) -> Self {
        value.0
    }
}
