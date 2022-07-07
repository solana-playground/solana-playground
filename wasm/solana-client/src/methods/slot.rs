use solana_sdk::{clock::Slot, commitment_config::CommitmentConfig};

use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetSlotRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    config: Option<CommitmentConfig>,
}

impl GetSlotRequest {
    pub fn new() -> Self {
        Self { config: None }
    }

    pub fn new_with_config(config: CommitmentConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

impl Into<serde_json::Value> for GetSlotRequest {
    fn into(self) -> serde_json::Value {
        match self.config {
            Some(config) => serde_json::json!([config]),
            None => serde_json::Value::Null,
        }
    }
}

impl Into<ClientRequest> for GetSlotRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getSlot");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetSlotResponse(Slot);

impl From<ClientResponse> for GetSlotResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl Into<Slot> for GetSlotResponse {
    fn into(self) -> Slot {
        self.0
    }
}
