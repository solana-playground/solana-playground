use solana_sdk::clock::Slot;

use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct MinimumLedgerSlotRequest {}

impl MinimumLedgerSlotRequest {
    pub fn new() -> Self {
        Self::default()
    }
}

impl From<MinimumLedgerSlotRequest> for serde_json::Value {
    fn from(_val: MinimumLedgerSlotRequest) -> Self {
        serde_json::Value::Null
    }
}

impl From<MinimumLedgerSlotRequest> for ClientRequest {
    fn from(val: MinimumLedgerSlotRequest) -> Self {
        let mut request = ClientRequest::new("minimumLedgerSlot");
        let params = val.into();

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

impl From<MinimumLedgerSlotResponse> for Slot {
    fn from(val: MinimumLedgerSlotResponse) -> Self {
        val.0
    }
}
