use solana_sdk::commitment_config::CommitmentConfig;

use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetMinimumBalanceForRentExemptionRequest {
    pub data_length: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<CommitmentConfig>,
}

impl GetMinimumBalanceForRentExemptionRequest {
    pub fn new(data_length: usize) -> Self {
        Self {
            data_length,
            config: None,
        }
    }
    pub fn new_with_config(data_length: usize, config: CommitmentConfig) -> Self {
        Self {
            data_length,
            config: Some(config),
        }
    }
}

impl From<GetMinimumBalanceForRentExemptionRequest> for serde_json::Value {
    fn from(value: GetMinimumBalanceForRentExemptionRequest) -> Self {
        match value.config {
            Some(config) => {
                serde_json::json!([value.data_length, config])
            }
            None => serde_json::json!([value.data_length]),
        }
    }
}

impl From<GetMinimumBalanceForRentExemptionRequest> for ClientRequest {
    fn from(val: GetMinimumBalanceForRentExemptionRequest) -> Self {
        let mut request = ClientRequest::new("getMinimumBalanceForRentExemption");
        let params = val.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetMinimumBalanceForRentExemptionResponse(u64);

impl From<ClientResponse> for GetMinimumBalanceForRentExemptionResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl From<GetMinimumBalanceForRentExemptionResponse> for u64 {
    fn from(val: GetMinimumBalanceForRentExemptionResponse) -> Self {
        val.0
    }
}
