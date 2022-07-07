use serde::Deserialize;

use super::Context;
use crate::{
    utils::{rpc_config::RpcBlockProductionConfig, rpc_response::RpcBlockProduction},
    ClientRequest, ClientResponse,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetBlockProductionRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<RpcBlockProductionConfig>,
}

impl GetBlockProductionRequest {
    pub fn new() -> Self {
        Self {
            config: Some(RpcBlockProductionConfig {
                commitment: None,
                range: None,
                identity: None,
            }),
        }
    }
    pub fn new_with_config(config: RpcBlockProductionConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

impl Into<serde_json::Value> for GetBlockProductionRequest {
    fn into(self) -> serde_json::Value {
        serde_json::json!([self.config])
    }
}

impl Into<ClientRequest> for GetBlockProductionRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getBlockProduction");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetBlockProductionResponse {
    pub context: Context,
    pub value: RpcBlockProduction,
}

impl From<ClientResponse> for GetBlockProductionResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}
