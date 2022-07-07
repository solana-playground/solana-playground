use solana_sdk::clock::Slot;

use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetFirstAvailableBlockRequest {}

impl GetFirstAvailableBlockRequest {
    pub fn new() -> Self {
        Self {}
    }
}

impl Into<serde_json::Value> for GetFirstAvailableBlockRequest {
    fn into(self) -> serde_json::Value {
        serde_json::Value::Null
    }
}

impl Into<ClientRequest> for GetFirstAvailableBlockRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getFirstAvailableBlock");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetFirstAvailableBlockResponse(Slot);

impl From<ClientResponse> for GetFirstAvailableBlockResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl Into<Slot> for GetFirstAvailableBlockResponse {
    fn into(self) -> Slot {
        self.0
    }
}
