use solana_extra_wasm::account_decoder::UiAccount;
use solana_sdk::pubkey::Pubkey;

use super::Context;
use crate::{utils::rpc_config::RpcAccountInfoConfig, ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetMultipleAccountsRequest {
    pub addresses: Vec<Pubkey>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<RpcAccountInfoConfig>,
}

impl GetMultipleAccountsRequest {
    pub fn new(addresses: Vec<Pubkey>) -> Self {
        Self {
            addresses,
            config: None,
        }
    }
    pub fn new_with_config(addresses: Vec<Pubkey>, config: RpcAccountInfoConfig) -> Self {
        Self {
            addresses,
            config: Some(config),
        }
    }
}

impl From<GetMultipleAccountsRequest> for serde_json::Value {
    fn from(value: GetMultipleAccountsRequest) -> Self {
        let addresses = value
            .addresses
            .iter()
            .map(|address| address.to_string())
            .collect::<Vec<String>>();

        match value.config {
            Some(config) => serde_json::json!([addresses, config]),
            None => serde_json::json!([addresses]),
        }
    }
}

impl From<GetMultipleAccountsRequest> for ClientRequest {
    fn from(val: GetMultipleAccountsRequest) -> Self {
        let mut request = ClientRequest::new("getMultipleAccounts");
        let params = val.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetMultipleAccountsResponse {
    pub context: Context,
    pub value: Vec<Option<UiAccount>>,
}

impl From<ClientResponse> for GetMultipleAccountsResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}
