use std::str::FromStr;

use solana_sdk::{commitment_config::CommitmentConfig, pubkey::Pubkey};

use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetSlotLeaderRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<CommitmentConfig>,
}

impl GetSlotLeaderRequest {
    pub fn new() -> Self {
        Self { config: None }
    }

    pub fn new_with_config(config: CommitmentConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

impl Into<serde_json::Value> for GetSlotLeaderRequest {
    fn into(self) -> serde_json::Value {
        match self.config {
            Some(config) => serde_json::json!([config]),
            None => serde_json::Value::Null,
        }
    }
}

impl Into<ClientRequest> for GetSlotLeaderRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getSlotLeader");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetSlotLeaderResponse(Pubkey);

impl Into<Pubkey> for GetSlotLeaderResponse {
    fn into(self) -> Pubkey {
        self.0
    }
}

impl From<ClientResponse> for GetSlotLeaderResponse {
    fn from(response: ClientResponse) -> Self {
        let pubkey = response.result.as_str().expect("Invalid response");
        GetSlotLeaderResponse(Pubkey::from_str(pubkey).expect("Invalid public key"))
    }
}
