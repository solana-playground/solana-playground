use crate::{utils::rpc_config::RpcContextConfig, ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]

pub struct GetTransactionCountRequest {
    pub config: Option<RpcContextConfig>,
}

impl GetTransactionCountRequest {
    pub fn new() -> Self {
        Self { config: None }
    }
    pub fn new_with_config(config: RpcContextConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

impl Into<serde_json::Value> for GetTransactionCountRequest {
    fn into(self) -> serde_json::Value {
        match self.config {
            Some(config) => serde_json::json!([config]),
            None => serde_json::Value::Null,
        }
    }
}

impl Into<ClientRequest> for GetTransactionCountRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getTransactionCount");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetTransactionCountResponse(u64);

impl From<ClientResponse> for GetTransactionCountResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl Into<u64> for GetTransactionCountResponse {
    fn into(self) -> u64 {
        self.0
    }
}
