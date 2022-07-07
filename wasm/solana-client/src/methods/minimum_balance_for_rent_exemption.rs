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

impl Into<serde_json::Value> for GetMinimumBalanceForRentExemptionRequest {
    fn into(self) -> serde_json::Value {
        match self.config {
            Some(config) => {
                serde_json::json!([self.data_length, config])
            }
            None => serde_json::json!([self.data_length]),
        }
    }
}

impl Into<ClientRequest> for GetMinimumBalanceForRentExemptionRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getMinimumBalanceForRentExemption");
        let params = self.into();

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

impl Into<u64> for GetMinimumBalanceForRentExemptionResponse {
    fn into(self) -> u64 {
        self.0
    }
}
