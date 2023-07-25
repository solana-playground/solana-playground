use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GetHighestSnapshotSlotRequest {}

impl GetHighestSnapshotSlotRequest {
    pub fn new() -> Self {
        Self::default()
    }
}

impl From<GetHighestSnapshotSlotRequest> for serde_json::Value {
    fn from(_val: GetHighestSnapshotSlotRequest) -> Self {
        serde_json::Value::Null
    }
}

impl From<GetHighestSnapshotSlotRequest> for ClientRequest {
    fn from(val: GetHighestSnapshotSlotRequest) -> Self {
        let mut request = ClientRequest::new("getHighestSnapshotSlot");
        let params = val.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetHighestSnapshotSlotResponse {
    pub full: u64,
    pub incremental: Option<u64>,
}

impl From<ClientResponse> for GetHighestSnapshotSlotResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}
