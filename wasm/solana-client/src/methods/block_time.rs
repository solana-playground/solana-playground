use solana_sdk::clock::UnixTimestamp;

use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetBlockTimeRequest {
    pub slot: u64,
}

impl GetBlockTimeRequest {
    pub fn new(slot: u64) -> Self {
        Self { slot }
    }
}

impl From<GetBlockTimeRequest> for serde_json::Value {
    fn from(value: GetBlockTimeRequest) -> Self {
        serde_json::json!([value.slot])
    }
}

impl From<GetBlockTimeRequest> for ClientRequest {
    fn from(value: GetBlockTimeRequest) -> Self {
        let mut request = ClientRequest::new("getBlockTime");
        let params = value.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetBlockTimeResponse(Option<UnixTimestamp>);

impl From<ClientResponse> for GetBlockTimeResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl From<GetBlockTimeResponse> for Option<UnixTimestamp> {
    fn from(val: GetBlockTimeResponse) -> Self {
        val.0
    }
}
