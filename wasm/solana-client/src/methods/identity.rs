use solana_sdk::pubkey::Pubkey;

use super::serde_utils::deserialize_public_key;
use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetIdentityRequest {}

impl GetIdentityRequest {
    pub fn new() -> Self {
        Self {}
    }
}

impl Into<serde_json::Value> for GetIdentityRequest {
    fn into(self) -> serde_json::Value {
        serde_json::Value::Null
    }
}

impl Into<ClientRequest> for GetIdentityRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getIdentity");
        let params = self.into();

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
