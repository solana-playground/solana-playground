use std::str::FromStr;

use solana_sdk::pubkey::Pubkey;

use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetSlotLeadersRequest {
    pub start_slot: u64,
    pub limit: u64,
}

impl GetSlotLeadersRequest {
    pub fn new(start_slot: u64, limit: u64) -> Self {
        Self { start_slot, limit }
    }
}

impl Into<serde_json::Value> for GetSlotLeadersRequest {
    fn into(self) -> serde_json::Value {
        serde_json::json!([self.start_slot, self.limit])
    }
}

impl Into<ClientRequest> for GetSlotLeadersRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getSlotLeaders");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetSlotLeadersResponse(Vec<Pubkey>);

impl From<ClientResponse> for GetSlotLeadersResponse {
    fn from(response: ClientResponse) -> Self {
        let public_keys = response
            .result
            .as_array()
            .expect("public keys is an array")
            .to_vec();
        let public_keys = public_keys
            .iter()
            .map(|pubkey| {
                let pubkey = pubkey.as_str().expect("public key is a string");
                Pubkey::from_str(pubkey).expect("public key is valid")
            })
            .collect();
        GetSlotLeadersResponse(public_keys)
    }
}
