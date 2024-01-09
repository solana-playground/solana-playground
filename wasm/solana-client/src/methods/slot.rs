use solana_sdk::{clock::Slot, commitment_config::CommitmentConfig};

use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GetSlotRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    config: Option<CommitmentConfig>,
}

impl GetSlotRequest {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn new_with_config(config: CommitmentConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

impl From<GetSlotRequest> for serde_json::Value {
    fn from(value: GetSlotRequest) -> Self {
        match value.config {
            Some(config) => serde_json::json!([config]),
            None => serde_json::Value::Null,
        }
    }
}

impl From<GetSlotRequest> for ClientRequest {
    fn from(val: GetSlotRequest) -> Self {
        let mut request = ClientRequest::new("getSlot");
        let params = val.into();

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

impl From<GetSlotResponse> for Slot {
    fn from(val: GetSlotResponse) -> Self {
        val.0
    }
}
