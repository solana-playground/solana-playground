use solana_sdk::epoch_schedule::EpochSchedule;

use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetEpochScheduleRequest {}

impl GetEpochScheduleRequest {
    pub fn new() -> Self {
        Self {}
    }
}

impl Into<serde_json::Value> for GetEpochScheduleRequest {
    fn into(self) -> serde_json::Value {
        serde_json::Value::Null
    }
}

impl Into<ClientRequest> for GetEpochScheduleRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getEpochSchedule");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetEpochScheduleResponse(EpochSchedule);

impl From<ClientResponse> for GetEpochScheduleResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl Into<EpochSchedule> for GetEpochScheduleResponse {
    fn into(self) -> EpochSchedule {
        self.0
    }
}
