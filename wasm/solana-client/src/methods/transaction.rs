use solana_extra_wasm::transaction_status::EncodedConfirmedTransactionWithStatusMeta;
use solana_sdk::signature::Signature;

use crate::{utils::rpc_config::RpcTransactionConfig, ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetTransactionRequest {
    pub signature: Signature,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<RpcTransactionConfig>,
}

impl GetTransactionRequest {
    pub fn new(signature: Signature) -> Self {
        Self {
            signature,
            config: None,
        }
    }
    pub fn new_with_config(signature: Signature, config: RpcTransactionConfig) -> Self {
        Self {
            signature,
            config: Some(config),
        }
    }
}

impl From<GetTransactionRequest> for serde_json::Value {
    fn from(value: GetTransactionRequest) -> Self {
        let signature = value.signature.to_string();

        match value.config {
            Some(config) => serde_json::json!([signature, config]),
            None => serde_json::json!([signature]),
        }
    }
}

impl From<GetTransactionRequest> for ClientRequest {
    fn from(value: GetTransactionRequest) -> Self {
        let mut request = ClientRequest::new("getTransaction");
        let params = value.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetTransactionResponse(Option<EncodedConfirmedTransactionWithStatusMeta>);

impl From<ClientResponse> for GetTransactionResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl From<GetTransactionResponse> for Option<EncodedConfirmedTransactionWithStatusMeta> {
    fn from(value: GetTransactionResponse) -> Self {
        value.0
    }
}
