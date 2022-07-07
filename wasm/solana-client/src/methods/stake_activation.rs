use solana_sdk::pubkey::Pubkey;

use crate::{
    utils::{rpc_config::RpcEpochConfig, rpc_response::RpcStakeActivation},
    ClientRequest, ClientResponse,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetStakeActivationRequest {
    pubkey: Pubkey,
    #[serde(skip_serializing_if = "Option::is_none")]
    config: Option<RpcEpochConfig>,
}

impl GetStakeActivationRequest {
    pub fn new(pubkey: Pubkey) -> Self {
        Self {
            pubkey,
            config: None,
        }
    }

    pub fn new_with_config(pubkey: Pubkey, config: RpcEpochConfig) -> Self {
        Self {
            pubkey,
            config: Some(config),
        }
    }
}

impl Into<serde_json::Value> for GetStakeActivationRequest {
    fn into(self) -> serde_json::Value {
        let pubkey = self.pubkey.to_string();

        match self.config {
            Some(config) => serde_json::json!([pubkey, config]),
            None => serde_json::json!([pubkey]),
        }
    }
}

impl Into<ClientRequest> for GetStakeActivationRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getStakeActivation");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetStakeActivationResponse(RpcStakeActivation);

impl From<ClientResponse> for GetStakeActivationResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl Into<RpcStakeActivation> for GetStakeActivationResponse {
    fn into(self) -> RpcStakeActivation {
        self.0
    }
}
