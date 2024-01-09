use std::str::FromStr;

use solana_extra_wasm::transaction_status::UiTransactionEncoding;
use solana_sdk::{signature::Signature, transaction::Transaction};

use crate::utils::rpc_config::{serialize_and_encode, RpcSendTransactionConfig};
use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SendTransactionRequest {
    transaction: Transaction,
    #[serde(skip_serializing_if = "Option::is_none")]
    config: Option<RpcSendTransactionConfig>,
}

impl SendTransactionRequest {
    pub fn new(transaction: Transaction) -> Self {
        Self {
            transaction,
            config: None,
        }
    }
    pub fn new_with_config(transaction: Transaction, config: RpcSendTransactionConfig) -> Self {
        Self {
            transaction,
            config: Some(config),
        }
    }
}

impl From<SendTransactionRequest> for serde_json::Value {
    fn from(value: SendTransactionRequest) -> Self {
        let encoding = match value.config {
            Some(ref c) => c.encoding.unwrap_or(UiTransactionEncoding::Base64),
            None => UiTransactionEncoding::Base64,
        };

        let serialized_encoded =
            serialize_and_encode::<Transaction>(&value.transaction, encoding).unwrap();

        match value.config {
            Some(config) => serde_json::json!([serialized_encoded, config]),
            None => serde_json::json!([serialized_encoded]),
        }
    }
}

impl From<SendTransactionRequest> for ClientRequest {
    fn from(val: SendTransactionRequest) -> Self {
        let mut request = ClientRequest::new("sendTransaction");
        let params = val.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SendTransactionResponse(Signature);

impl From<SendTransactionResponse> for Signature {
    fn from(val: SendTransactionResponse) -> Self {
        val.0
    }
}

impl From<ClientResponse> for SendTransactionResponse {
    fn from(response: ClientResponse) -> Self {
        let signature = response.result.as_str().expect("invalid response");
        let signature = Signature::from_str(signature).expect("invalid signature");

        SendTransactionResponse(signature)
    }
}
