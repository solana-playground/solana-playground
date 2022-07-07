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

impl Into<serde_json::Value> for GetBlockTimeRequest {
    fn into(self) -> serde_json::Value {
        serde_json::json!([self.slot])
    }
}

impl Into<ClientRequest> for GetBlockTimeRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getBlockTime");
        let params = self.into();

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

impl Into<Option<UnixTimestamp>> for GetBlockTimeResponse {
    fn into(self) -> Option<UnixTimestamp> {
        self.0
    }
}
