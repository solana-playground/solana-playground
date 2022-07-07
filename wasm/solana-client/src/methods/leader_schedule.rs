use solana_sdk::clock::Slot;

use crate::{
    utils::{rpc_config::RpcLeaderScheduleConfig, rpc_response::RpcLeaderSchedule},
    ClientRequest, ClientResponse,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetLeaderScheduleRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub slot: Option<Slot>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<RpcLeaderScheduleConfig>,
}

impl GetLeaderScheduleRequest {
    pub fn new() -> Self {
        Self {
            slot: None,
            config: None,
        }
    }
    pub fn new_with_slot_and_config(slot: Slot, config: RpcLeaderScheduleConfig) -> Self {
        Self {
            slot: Some(slot),
            config: Some(config),
        }
    }
    pub fn new_with_config(config: RpcLeaderScheduleConfig) -> Self {
        Self {
            slot: None,
            config: Some(config),
        }
    }
}

impl Into<serde_json::Value> for GetLeaderScheduleRequest {
    fn into(self) -> serde_json::Value {
        match (self.slot, self.config) {
            (Some(slot), Some(config)) => serde_json::json!([slot, config]),
            (Some(slot), None) => serde_json::json!([slot]),
            (None, Some(config)) => serde_json::json!([config]),
            _ => serde_json::Value::Null,
        }
    }
}

impl Into<ClientRequest> for GetLeaderScheduleRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getLeaderSchedule");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetLeaderScheduleResponse(Option<RpcLeaderSchedule>);

impl From<ClientResponse> for GetLeaderScheduleResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl Into<Option<RpcLeaderSchedule>> for GetLeaderScheduleResponse {
    fn into(self) -> Option<RpcLeaderSchedule> {
        self.0
    }
}
