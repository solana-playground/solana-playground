use solana_sdk::commitment_config::CommitmentConfig;

use super::Context;
use crate::{utils::rpc_response::RpcBlockhash, ClientRequest, ClientResponse};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GetLatestBlockhashRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<CommitmentConfig>,
}

impl GetLatestBlockhashRequest {
    pub fn new() -> Self {
        Self::default()
    }
    pub fn new_with_config(config: CommitmentConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

impl From<GetLatestBlockhashRequest> for serde_json::Value {
    fn from(value: GetLatestBlockhashRequest) -> Self {
        match value.config {
            Some(config) => serde_json::json!([config]),
            None => serde_json::Value::Null,
        }
    }
}

impl From<GetLatestBlockhashRequest> for ClientRequest {
    fn from(value: GetLatestBlockhashRequest) -> Self {
        let mut request = ClientRequest::new("getLatestBlockhash");
        let params = value.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetLatestBlockhashResponse {
    pub context: Context,
    pub value: RpcBlockhash,
}

impl From<ClientResponse> for GetLatestBlockhashResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}
