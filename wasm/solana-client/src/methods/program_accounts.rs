use solana_sdk::pubkey::Pubkey;

use crate::{
    utils::rpc_config::{RpcKeyedAccount, RpcProgramAccountsConfig},
    {ClientRequest, ClientResponse},
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetProgramAccountsRequest {
    pub pubkey: Pubkey,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<RpcProgramAccountsConfig>,
}

impl GetProgramAccountsRequest {
    pub fn new(pubkey: Pubkey) -> Self {
        Self {
            pubkey,
            config: None,
        }
    }

    pub fn new_with_config(pubkey: Pubkey, config: RpcProgramAccountsConfig) -> Self {
        Self {
            pubkey,
            config: Some(config),
        }
    }
}

impl From<GetProgramAccountsRequest> for serde_json::Value {
    fn from(value: GetProgramAccountsRequest) -> Self {
        let pubkey = value.pubkey.to_string();

        match value.config {
            Some(config) => serde_json::json!([pubkey, config]),
            None => serde_json::json!([pubkey]),
        }
    }
}

impl From<GetProgramAccountsRequest> for ClientRequest {
    fn from(val: GetProgramAccountsRequest) -> Self {
        let mut request = ClientRequest::new("getProgramAccounts");
        let params = val.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetProgramAccountsResponse(Option<Vec<RpcKeyedAccount>>);

impl From<ClientResponse> for GetProgramAccountsResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl GetProgramAccountsResponse {
    pub fn keyed_accounts(&self) -> Option<&Vec<RpcKeyedAccount>> {
        self.0.as_ref()
    }
}
