use solana_sdk::pubkey::Pubkey;

use crate::{
    utils::{rpc_config::RpcEpochConfig, rpc_response::RpcInflationReward},
    ClientRequest, ClientResponse,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetInflationRewardRequest {
    pub addresses: Vec<Pubkey>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<RpcEpochConfig>,
}

impl GetInflationRewardRequest {
    pub fn new(addresses: Vec<Pubkey>) -> Self {
        Self {
            addresses,
            config: None,
        }
    }
    pub fn new_with_config(addresses: Vec<Pubkey>, config: RpcEpochConfig) -> Self {
        Self {
            addresses,
            config: Some(config),
        }
    }
}

impl Into<serde_json::Value> for GetInflationRewardRequest {
    fn into(self) -> serde_json::Value {
        let addresses = self
            .addresses
            .iter()
            .map(|o| o.to_string())
            .collect::<Vec<String>>();

        match self.config {
            Some(config) => serde_json::json!([addresses, config]),
            None => serde_json::json!([addresses]),
        }
    }
}

impl Into<ClientRequest> for GetInflationRewardRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getInflationReward");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetInflationRewardResponse(Vec<Option<RpcInflationReward>>);

impl From<ClientResponse> for GetInflationRewardResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl Into<Vec<Option<RpcInflationReward>>> for GetInflationRewardResponse {
    fn into(self) -> Vec<Option<RpcInflationReward>> {
        self.0
    }
}
