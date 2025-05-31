use serde_tuple::Serialize_tuple;
use serde_with::skip_serializing_none;
use solana_sdk::{clock::Slot, commitment_config::CommitmentConfig};

use crate::{impl_method, ClientRequest, ClientResponse};

#[skip_serializing_none]
#[derive(Debug, Default, Serialize_tuple)]
pub struct GetSlotRequest {
    config: Option<CommitmentConfig>,
}

impl_method!(GetSlotRequest, "getSlot");

impl GetSlotRequest {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn new_with_config(config: CommitmentConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetSlotResponse(Slot);

impl From<GetSlotResponse> for Slot {
    fn from(val: GetSlotResponse) -> Self {
        val.0
    }
}

#[cfg(test)]
mod tests {
    use serde_json::Value;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetSlotRequest::NAME)
            .id(1)
            .params(GetSlotRequest::new());

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1, "method":"getSlot"}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{ "jsonrpc": "2.0", "result": 1234, "id": 1 }"#;

        let response: ClientResponse<GetSlotResponse> = serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(response.result.0, 1234);
    }
}
