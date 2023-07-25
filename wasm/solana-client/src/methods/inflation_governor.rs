use solana_sdk::commitment_config::CommitmentConfig;

use crate::{utils::rpc_response::RpcInflationGovernor, ClientRequest, ClientResponse};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GetInflationGovernorRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<CommitmentConfig>,
}

impl GetInflationGovernorRequest {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn new_with_config(config: CommitmentConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

impl From<GetInflationGovernorRequest> for serde_json::Value {
    fn from(value: GetInflationGovernorRequest) -> Self {
        match value.config {
            Some(config) => serde_json::json!([config]),
            None => serde_json::Value::Null,
        }
    }
}

impl From<GetInflationGovernorRequest> for ClientRequest {
    fn from(val: GetInflationGovernorRequest) -> Self {
        let mut request = ClientRequest::new("getInflationGovernor");
        let params = val.into();

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

impl From<GetInflationGovernorResponse> for RpcInflationGovernor {
    fn from(value: GetInflationGovernorResponse) -> Self {
        value.0
    }
}
