use std::str::FromStr;

use solana_sdk::{commitment_config::CommitmentConfig, pubkey::Pubkey};

use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GetSlotLeaderRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<CommitmentConfig>,
}

impl GetSlotLeaderRequest {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn new_with_config(config: CommitmentConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

impl From<GetSlotLeaderRequest> for serde_json::Value {
    fn from(value: GetSlotLeaderRequest) -> Self {
        match value.config {
            Some(config) => serde_json::json!([config]),
            None => serde_json::Value::Null,
        }
    }
}

impl From<GetSlotLeaderRequest> for ClientRequest {
    fn from(val: GetSlotLeaderRequest) -> Self {
        let mut request = ClientRequest::new("getSlotLeader");
        let params = val.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetSlotLeaderResponse(Pubkey);

impl From<GetSlotLeaderResponse> for Pubkey {
    fn from(val: GetSlotLeaderResponse) -> Self {
        val.0
    }
}

impl From<ClientResponse> for GetSlotLeaderResponse {
    fn from(response: ClientResponse) -> Self {
        let pubkey = response.result.as_str().expect("Invalid response");
        GetSlotLeaderResponse(Pubkey::from_str(pubkey).expect("Invalid public key"))
    }
}
