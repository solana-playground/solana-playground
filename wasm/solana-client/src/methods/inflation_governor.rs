use solana_sdk::commitment_config::CommitmentConfig;

use crate::{utils::rpc_response::RpcInflationGovernor, ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetInflationGovernorRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<CommitmentConfig>,
}

impl GetInflationGovernorRequest {
    pub fn new() -> Self {
        Self { config: None }
    }

    pub fn new_with_config(config: CommitmentConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

impl Into<serde_json::Value> for GetInflationGovernorRequest {
    fn into(self) -> serde_json::Value {
        match self.config {
            Some(config) => serde_json::json!([config]),
            None => serde_json::Value::Null,
        }
    }
}

impl Into<ClientRequest> for GetInflationGovernorRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getInflationGovernor");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetInflationGovernorResponse(RpcInflationGovernor);

impl From<ClientResponse> for GetInflationGovernorResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl Into<RpcInflationGovernor> for GetInflationGovernorResponse {
    fn into(self) -> RpcInflationGovernor {
        self.0
    }
}
