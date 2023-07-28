use solana_sdk::hash::Hash;

use super::Context;
use crate::{utils::rpc_config::RpcContextConfig, ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IsBlockhashValidRequest {
    blockhash: Hash,
    #[serde(skip_serializing_if = "Option::is_none")]
    config: Option<RpcContextConfig>,
}

impl IsBlockhashValidRequest {
    pub fn new(blockhash: Hash) -> Self {
        Self {
            blockhash,
            config: None,
        }
    }
    pub fn new_with_config(blockhash: Hash, config: RpcContextConfig) -> Self {
        Self {
            blockhash,
            config: Some(config),
        }
    }
}

impl From<IsBlockhashValidRequest> for serde_json::Value {
    fn from(value: IsBlockhashValidRequest) -> Self {
        let blockhash = value.blockhash.to_string();

        match value.config {
            Some(_) => serde_json::json!([blockhash, value.config]),
            None => serde_json::json!([blockhash]),
        }
    }
}

impl From<IsBlockhashValidRequest> for ClientRequest {
    fn from(value: IsBlockhashValidRequest) -> Self {
        let mut request = ClientRequest::new("isBlockhashValid");
        let params = value.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IsBlockhashValidResponse {
    pub context: Context,
    pub value: bool,
}

impl From<ClientResponse> for IsBlockhashValidResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}
