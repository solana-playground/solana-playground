use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetHighestSnapshotSlotRequest {}

impl GetHighestSnapshotSlotRequest {
    pub fn new() -> Self {
        Self {}
    }
}

impl Into<serde_json::Value> for GetHighestSnapshotSlotRequest {
    fn into(self) -> serde_json::Value {
        serde_json::Value::Null
    }
}

impl Into<ClientRequest> for GetHighestSnapshotSlotRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getHighestSnapshotSlot");
        let params = self.into();

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
