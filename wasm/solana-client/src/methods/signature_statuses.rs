use solana_extra_wasm::transaction_status::TransactionConfirmationStatus;
use solana_sdk::{signature::Signature, transaction::TransactionError};

use super::Context;
use crate::{utils::rpc_config::RpcSignatureStatusConfig, ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetSignatureStatusesRequest {
    pub signatures: Vec<Signature>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<RpcSignatureStatusConfig>,
}

impl GetSignatureStatusesRequest {
    pub fn new(signatures: Vec<Signature>) -> Self {
        Self {
            signatures,
            config: None,
        }
    }

    pub fn new_with_config(signatures: Vec<Signature>, config: RpcSignatureStatusConfig) -> Self {
        Self {
            signatures,
            config: Some(config),
        }
    }
}

impl Into<serde_json::Value> for GetSignatureStatusesRequest {
    fn into(self) -> serde_json::Value {
        let signatures = self
            .signatures
            .iter()
            .map(|s| s.to_string())
            .collect::<Vec<String>>();

        match self.config {
            Some(config) => serde_json::json!([signatures, config]),
            None => serde_json::json!([signatures]),
        }
    }
}

impl Into<ClientRequest> for GetSignatureStatusesRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getSignatureStatuses");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SignatureStatusesValue {
    pub slot: u64,
    pub confirmations: Option<u64>,
    pub err: Option<TransactionError>,
    pub confirmation_status: Option<TransactionConfirmationStatus>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetSignatureStatusesResponse {
    pub context: Context,
    pub value: Vec<Option<SignatureStatusesValue>>,
}

impl From<ClientResponse> for GetSignatureStatusesResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}
