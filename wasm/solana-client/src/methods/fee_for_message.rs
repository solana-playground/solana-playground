use solana_extra_wasm::transaction_status::UiTransactionEncoding;
use solana_sdk::{commitment_config::CommitmentConfig, message::Message};

use super::Context;
use crate::{utils::rpc_config::serialize_and_encode, ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetFeeForMessageRequest {
    pub message: Message,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<CommitmentConfig>,
}

impl GetFeeForMessageRequest {
    pub fn new(message: Message) -> Self {
        Self {
            message,
            config: None,
        }
    }
    pub fn new_with_config(message: Message, config: CommitmentConfig) -> Self {
        Self {
            message,
            config: Some(config),
        }
    }
}

impl Into<serde_json::Value> for GetFeeForMessageRequest {
    fn into(self) -> serde_json::Value {
        let message =
            serialize_and_encode::<Message>(&self.message, UiTransactionEncoding::Base64).unwrap();

        match self.config {
            Some(config) => serde_json::json!([message, config]),
            None => serde_json::json!([message]),
        }
    }
}

impl Into<ClientRequest> for GetFeeForMessageRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getFeeForMessage");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeeForMessageValue(Option<u64>);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetFeeForMessageResponse {
    pub context: Context,
    pub value: FeeForMessageValue,
}

impl From<ClientResponse> for GetFeeForMessageResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl Into<u64> for GetFeeForMessageResponse {
    fn into(self) -> u64 {
        self.value.0.unwrap_or_default()
    }
}
