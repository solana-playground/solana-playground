use crate::{utils::rpc_config::RpcContextConfig, ClientRequest, ClientResponse};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]

pub struct GetTransactionCountRequest {
    pub config: Option<RpcContextConfig>,
}

impl GetTransactionCountRequest {
    pub fn new() -> Self {
        Self::default()
    }
    pub fn new_with_config(config: RpcContextConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

impl From<GetTransactionCountRequest> for serde_json::Value {
    fn from(value: GetTransactionCountRequest) -> Self {
        match value.config {
            Some(config) => serde_json::json!([config]),
            None => serde_json::Value::Null,
        }
    }
}

impl From<GetTransactionCountRequest> for ClientRequest {
    fn from(val: GetTransactionCountRequest) -> Self {
        let mut request = ClientRequest::new("getTransactionCount");
        let params = val.into();

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

impl From<GetTransactionCountResponse> for u64 {
    fn from(val: GetTransactionCountResponse) -> Self {
        val.0
    }
}
