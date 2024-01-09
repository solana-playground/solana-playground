use super::Context;
use crate::{
    utils::{rpc_config::RpcLargestAccountsConfig, rpc_response::RpcAccountBalance},
    ClientRequest, ClientResponse,
};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GetLargestAccountsRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<RpcLargestAccountsConfig>,
}

impl GetLargestAccountsRequest {
    pub fn new() -> Self {
        Self::default()
    }
    pub fn new_with_config(config: RpcLargestAccountsConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

impl From<GetLargestAccountsRequest> for serde_json::Value {
    fn from(value: GetLargestAccountsRequest) -> Self {
        match value.config {
            Some(config) => serde_json::json!([config]),
            None => serde_json::Value::Null,
        }
    }
}

impl From<GetLargestAccountsRequest> for ClientRequest {
    fn from(value: GetLargestAccountsRequest) -> Self {
        let mut request = ClientRequest::new("getLargestAccounts");
        let params = value.into();

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
