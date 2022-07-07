use solana_extra_wasm::transaction_status::UiConfirmedBlock;
use solana_sdk::clock::Slot;

use crate::{utils::rpc_config::RpcBlockConfig, ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetBlockRequest {
    pub slot: Slot,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<RpcBlockConfig>,
}

impl GetBlockRequest {
    pub fn new(slot: Slot) -> Self {
        Self { slot, config: None }
    }
    pub fn new_with_config(slot: Slot, config: RpcBlockConfig) -> Self {
        Self {
            slot,
            config: Some(config),
        }
    }
}

impl Into<serde_json::Value> for GetBlockRequest {
    fn into(self) -> serde_json::Value {
        match self.config {
            Some(config) => serde_json::json!([self.slot, config]),
            None => serde_json::json!([self.slot]),
        }
    }
}

impl Into<ClientRequest> for GetBlockRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getBlock");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetBlockResponse(UiConfirmedBlock);

impl From<ClientResponse> for GetBlockResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl Into<UiConfirmedBlock> for GetBlockResponse {
    fn into(self) -> UiConfirmedBlock {
        self.0
    }
}
