use serde::Deserialize;
use solana_extra_wasm::account_decoder::{UiAccount, UiAccountEncoding};
use solana_sdk::pubkey::Pubkey;

use super::Context;
use crate::{utils::rpc_config::RpcAccountInfoConfig, ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetAccountInfoRequest {
    pub pubkey: Pubkey,
    pub config: RpcAccountInfoConfig,
}

impl GetAccountInfoRequest {
    pub fn new(pubkey: Pubkey) -> Self {
        Self {
            pubkey,
            config: RpcAccountInfoConfig {
                encoding: Some(UiAccountEncoding::Base58),
                data_slice: None,
                commitment: None,
                min_context_slot: None,
            },
        }
    }
    pub fn new_with_config(pubkey: Pubkey, config: RpcAccountInfoConfig) -> Self {
        Self { pubkey, config }
    }
}

impl Into<serde_json::Value> for GetAccountInfoRequest {
    fn into(self) -> serde_json::Value {
        serde_json::json!([self.pubkey.to_string(), self.config])
    }
}

impl Into<ClientRequest> for GetAccountInfoRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getAccountInfo");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetAccountInfoResponse {
    pub context: Context,
    pub value: Option<UiAccount>,
}

impl From<ClientResponse> for GetAccountInfoResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}
