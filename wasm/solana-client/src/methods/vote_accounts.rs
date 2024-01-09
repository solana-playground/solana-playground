use crate::{
    utils::{rpc_config::RpcGetVoteAccountsConfig, rpc_response::RpcVoteAccountStatus},
    ClientRequest, ClientResponse,
};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GetVoteAccountsRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<RpcGetVoteAccountsConfig>,
}

impl GetVoteAccountsRequest {
    pub fn new() -> Self {
        Self::default()
    }
    pub fn new_with_config(config: RpcGetVoteAccountsConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

impl From<GetVoteAccountsRequest> for serde_json::Value {
    fn from(value: GetVoteAccountsRequest) -> Self {
        match value.config {
            Some(config) => serde_json::json!([config]),
            None => serde_json::Value::Null,
        }
    }
}

impl From<GetVoteAccountsRequest> for ClientRequest {
    fn from(value: GetVoteAccountsRequest) -> Self {
        let mut request = ClientRequest::new("getVoteAccounts");
        let params = value.into();

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

impl From<GetVoteAccountsResponse> for RpcVoteAccountStatus {
    fn from(value: GetVoteAccountsResponse) -> Self {
        value.0
    }
}
