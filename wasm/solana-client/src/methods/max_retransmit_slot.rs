use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GetMaxRetransmitSlotRequest {}

impl GetMaxRetransmitSlotRequest {
    pub fn new() -> Self {
        Self::default()
    }
}

impl From<GetMaxRetransmitSlotRequest> for serde_json::Value {
    fn from(_val: GetMaxRetransmitSlotRequest) -> Self {
        serde_json::Value::Null
    }
}

impl From<GetMaxRetransmitSlotRequest> for ClientRequest {
    fn from(val: GetMaxRetransmitSlotRequest) -> Self {
        let mut request = ClientRequest::new("getMaxRetransmitSlot");
        let params = val.into();

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
