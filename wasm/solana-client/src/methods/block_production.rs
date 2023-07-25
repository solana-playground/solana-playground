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
            config: Some(RpcBlockProductionConfig::default()),
        }
    }
    pub fn new_with_config(config: RpcBlockProductionConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

impl Default for GetBlockProductionRequest {
    fn default() -> Self {
        Self::new()
    }
}

impl From<GetBlockProductionRequest> for serde_json::Value {
    fn from(value: GetBlockProductionRequest) -> Self {
        serde_json::json!([value.config])
    }
}

impl From<GetBlockProductionRequest> for ClientRequest {
    fn from(value: GetBlockProductionRequest) -> Self {
        let mut request = ClientRequest::new("getBlockProduction");
        let params = value.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetBlockProductionResponse {
    pub context: Context,
    pub value: RpcBlockProduction,
}

impl From<ClientResponse> for GetBlockProductionResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}
