use solana_sdk::clock::Slot;

use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MinimumLedgerSlotRequest {}

impl MinimumLedgerSlotRequest {
    pub fn new() -> Self {
        Self {}
    }
}

impl Into<serde_json::Value> for MinimumLedgerSlotRequest {
    fn into(self) -> serde_json::Value {
        serde_json::Value::Null
    }
}

impl Into<ClientRequest> for MinimumLedgerSlotRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("minimumLedgerSlot");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MinimumLedgerSlotResponse(Slot);

impl From<ClientResponse> for MinimumLedgerSlotResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl Into<Slot> for MinimumLedgerSlotResponse {
    fn into(self) -> Slot {
        self.0
    }
}
