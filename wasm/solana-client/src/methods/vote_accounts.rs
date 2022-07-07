use crate::{
    utils::{rpc_config::RpcGetVoteAccountsConfig, rpc_response::RpcVoteAccountStatus},
    ClientRequest, ClientResponse,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetVoteAccountsRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<RpcGetVoteAccountsConfig>,
}

impl GetVoteAccountsRequest {
    pub fn new() -> Self {
        Self { config: None }
    }
    pub fn new_with_config(config: RpcGetVoteAccountsConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

impl Into<serde_json::Value> for GetVoteAccountsRequest {
    fn into(self) -> serde_json::Value {
        match self.config {
            Some(config) => serde_json::json!([config]),
            None => serde_json::Value::Null,
        }
    }
}

impl Into<ClientRequest> for GetVoteAccountsRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getVoteAccounts");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetVoteAccountsResponse(RpcVoteAccountStatus);

impl From<ClientResponse> for GetVoteAccountsResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl Into<RpcVoteAccountStatus> for GetVoteAccountsResponse {
    fn into(self) -> RpcVoteAccountStatus {
        self.0
    }
}
