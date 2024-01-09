use solana_sdk::pubkey::Pubkey;

use super::Context;
use crate::{
    utils::rpc_config::{RpcAccountInfoConfig, RpcKeyedAccount, RpcTokenAccountsFilter},
    ClientRequest, ClientResponse,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetTokenAccountsByOwnerRequest {
    pub owner: Pubkey,
    pub filter: RpcTokenAccountsFilter,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<RpcAccountInfoConfig>,
}

impl GetTokenAccountsByOwnerRequest {
    pub fn new(owner: Pubkey, filter: RpcTokenAccountsFilter) -> Self {
        Self {
            owner,
            filter,
            config: None,
        }
    }

    pub fn new_with_config(
        owner: Pubkey,
        filter: RpcTokenAccountsFilter,
        config: RpcAccountInfoConfig,
    ) -> Self {
        Self {
            owner,
            filter,
            config: Some(config),
        }
    }
}

impl From<GetTokenAccountsByOwnerRequest> for serde_json::Value {
    fn from(value: GetTokenAccountsByOwnerRequest) -> Self {
        serde_json::json!([value.owner.to_string(), value.filter, value.config])
    }
}

impl From<GetTokenAccountsByOwnerRequest> for ClientRequest {
    fn from(value: GetTokenAccountsByOwnerRequest) -> Self {
        let mut request = ClientRequest::new("getTokenAccountsByOwner");
        let params = value.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetTokenAccountsByOwnerResponse {
    pub context: Context,
    pub value: Vec<RpcKeyedAccount>,
}

impl From<ClientResponse> for GetTokenAccountsByOwnerResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}
