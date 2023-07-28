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

impl From<GetSlotLeadersRequest> for serde_json::Value {
    fn from(value: GetSlotLeadersRequest) -> Self {
        serde_json::json!([value.start_slot, value.limit])
    }
}

impl From<GetSlotLeadersRequest> for ClientRequest {
    fn from(val: GetSlotLeadersRequest) -> Self {
        let mut request = ClientRequest::new("getSlotLeaders");
        let params = val.into();

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
