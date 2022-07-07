use solana_extra_wasm::transaction_status::{
    EncodedConfirmedTransactionWithStatusMeta, EncodedTransactionWithStatusMeta,
};
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
#[serde(rename_all = "camelCase")]
pub struct GetTransactionResponse {
    pub block_time: Option<i64>,
    pub meta: serde_json::Value,
    pub slot: u64,
    pub transaction: EncodedTransactionWithStatusMeta,
}

impl From<ClientResponse> for GetTransactionResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl Into<EncodedConfirmedTransactionWithStatusMeta> for GetTransactionResponse {
    fn into(self) -> EncodedConfirmedTransactionWithStatusMeta {
        EncodedConfirmedTransactionWithStatusMeta {
            block_time: self.block_time,
            slot: self.slot,
            transaction: self.transaction,
        }
    }
}
