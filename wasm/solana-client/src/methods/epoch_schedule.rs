use solana_sdk::epoch_schedule::EpochSchedule;

use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GetEpochScheduleRequest {}

impl GetEpochScheduleRequest {
    pub fn new() -> Self {
        Self::default()
    }
}

impl From<GetEpochScheduleRequest> for serde_json::Value {
    fn from(_: GetEpochScheduleRequest) -> Self {
        serde_json::Value::Null
    }
}

impl From<GetEpochScheduleRequest> for ClientRequest {
    fn from(value: GetEpochScheduleRequest) -> Self {
        let mut request = ClientRequest::new("getEpochSchedule");
        let params = value.into();

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

impl From<GetEpochScheduleResponse> for EpochSchedule {
    fn from(value: GetEpochScheduleResponse) -> Self {
        value.0
    }
}
