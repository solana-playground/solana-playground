use super::Context;
use crate::{
    utils::{rpc_config::RpcLargestAccountsConfig, rpc_response::RpcAccountBalance},
    ClientRequest, ClientResponse,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetLargestAccountsRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<RpcLargestAccountsConfig>,
}

impl GetLargestAccountsRequest {
    pub fn new() -> Self {
        Self { config: None }
    }
    pub fn new_with_config(config: RpcLargestAccountsConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

impl Into<serde_json::Value> for GetLargestAccountsRequest {
    fn into(self) -> serde_json::Value {
        match self.config {
            Some(config) => serde_json::json!([config]),
            None => serde_json::Value::Null,
        }
    }
}

impl Into<ClientRequest> for GetLargestAccountsRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getLargestAccounts");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetLargestAccountsResponse {
    pub context: Context,
    pub value: Vec<RpcAccountBalance>,
}

impl From<ClientResponse> for GetLargestAccountsResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}
