use solana_sdk::pubkey::Pubkey;

use super::serde_utils::deserialize_public_key;
use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GetIdentityRequest {}

impl GetIdentityRequest {
    pub fn new() -> Self {
        Self::default()
    }
}

impl From<GetIdentityRequest> for serde_json::Value {
    fn from(_val: GetIdentityRequest) -> Self {
        serde_json::Value::Null
    }
}

impl From<GetIdentityRequest> for ClientRequest {
    fn from(val: GetIdentityRequest) -> Self {
        let mut request = ClientRequest::new("getIdentity");
        let params = val.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetIdentityResponse {
    #[serde(deserialize_with = "deserialize_public_key")]
    pub identity: Pubkey,
}

impl From<ClientResponse> for GetIdentityResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}
