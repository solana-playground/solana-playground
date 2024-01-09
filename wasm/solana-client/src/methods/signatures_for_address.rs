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

impl From<GetSignaturesForAddressRequest> for serde_json::Value {
    fn from(value: GetSignaturesForAddressRequest) -> Self {
        let pubkey = value.pubkey.to_string();

        match value.config {
            Some(config) => serde_json::json!([pubkey, config]),
            None => serde_json::json!([pubkey]),
        }
    }
}

impl From<GetSignaturesForAddressRequest> for ClientRequest {
    fn from(val: GetSignaturesForAddressRequest) -> Self {
        let mut request = ClientRequest::new("getSignaturesForAddress");
        let params = val.into();

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

impl From<GetSignaturesForAddressResponse> for Vec<RpcConfirmedTransactionStatusWithSignature> {
    fn from(val: GetSignaturesForAddressResponse) -> Self {
        val.0
    }
}
