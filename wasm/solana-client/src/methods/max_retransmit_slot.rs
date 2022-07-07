use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetMaxRetransmitSlotRequest {}

impl GetMaxRetransmitSlotRequest {
    pub fn new() -> Self {
        Self {}
    }
}

impl Into<serde_json::Value> for GetMaxRetransmitSlotRequest {
    fn into(self) -> serde_json::Value {
        serde_json::Value::Null
    }
}

impl Into<ClientRequest> for GetMaxRetransmitSlotRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getMaxRetransmitSlot");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetMaxRetransmitSlotResponse(u64);

impl From<ClientResponse> for GetMaxRetransmitSlotResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}
