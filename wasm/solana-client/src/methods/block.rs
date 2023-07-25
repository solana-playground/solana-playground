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

impl From<GetBlockRequest> for serde_json::Value {
    fn from(value: GetBlockRequest) -> Self {
        match value.config {
            Some(config) => serde_json::json!([value.slot, config]),
            None => serde_json::json!([value.slot]),
        }
    }
}

impl From<GetBlockRequest> for ClientRequest {
    fn from(val: GetBlockRequest) -> Self {
        let mut request = ClientRequest::new("getBlock");
        let params = val.into();

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

impl From<GetBlockResponse> for UiConfirmedBlock {
    fn from(value: GetBlockResponse) -> Self {
        value.0
    }
}
