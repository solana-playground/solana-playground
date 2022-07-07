use solana_sdk::pubkey::Pubkey;

use crate::{
    utils::{
        rpc_config::RpcSignaturesForAddressConfig,
        rpc_response::RpcConfirmedTransactionStatusWithSignature,
    },
    ClientRequest, ClientResponse,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetSignaturesForAddressRequest {
    pubkey: Pubkey,
    #[serde(skip_serializing_if = "Option::is_none")]
    config: Option<RpcSignaturesForAddressConfig>,
}

impl GetSignaturesForAddressRequest {
    pub fn new(pubkey: Pubkey) -> Self {
        Self {
            pubkey,
            config: None,
        }
    }

    pub fn new_with_config(pubkey: Pubkey, config: RpcSignaturesForAddressConfig) -> Self {
        Self {
            pubkey,
            config: Some(config),
        }
    }
}

impl Into<serde_json::Value> for GetSignaturesForAddressRequest {
    fn into(self) -> serde_json::Value {
        let pubkey = self.pubkey.to_string();

        match self.config {
            Some(config) => serde_json::json!([pubkey, config]),
            None => serde_json::json!([pubkey]),
        }
    }
}

impl Into<ClientRequest> for GetSignaturesForAddressRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getSignaturesForAddress");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetSignaturesForAddressResponse(Vec<RpcConfirmedTransactionStatusWithSignature>);

impl From<ClientResponse> for GetSignaturesForAddressResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl Into<Vec<RpcConfirmedTransactionStatusWithSignature>> for GetSignaturesForAddressResponse {
    fn into(self) -> Vec<RpcConfirmedTransactionStatusWithSignature> {
        self.0
    }
}
