use solana_sdk::clock::Slot;

use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GetFirstAvailableBlockRequest {}

impl GetFirstAvailableBlockRequest {
    pub fn new() -> Self {
        Self::default()
    }
}

impl From<GetFirstAvailableBlockRequest> for serde_json::Value {
    fn from(_val: GetFirstAvailableBlockRequest) -> Self {
        serde_json::Value::Null
    }
}

impl From<GetFirstAvailableBlockRequest> for ClientRequest {
    fn from(val: GetFirstAvailableBlockRequest) -> Self {
        let mut request = ClientRequest::new("getFirstAvailableBlock");
        let params = val.into();

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

impl From<GetFirstAvailableBlockResponse> for Slot {
    fn from(val: GetFirstAvailableBlockResponse) -> Self {
        val.0
    }
}
