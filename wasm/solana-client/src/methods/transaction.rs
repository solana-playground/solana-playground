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

impl Into<serde_json::Value> for GetTransactionRequest {
    fn into(self) -> serde_json::Value {
        let signature = self.signature.to_string();

        match self.config {
            Some(config) => serde_json::json!([signature, config]),
            None => serde_json::json!([signature]),
        }
    }
}

impl Into<ClientRequest> for GetTransactionRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getTransaction");
        let params = self.into();

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

impl Into<Option<EncodedConfirmedTransactionWithStatusMeta>> for GetTransactionResponse {
    fn into(self) -> Option<EncodedConfirmedTransactionWithStatusMeta> {
        self.0
    }
}
