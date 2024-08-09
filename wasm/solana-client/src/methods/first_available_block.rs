use solana_sdk::clock::Slot;

use crate::{impl_method, ClientRequest, ClientResponse};

#[derive(Debug, Serialize)]
pub struct GetFirstAvailableBlockRequest;

impl_method!(GetFirstAvailableBlockRequest, "getFirstAvailableBlock");

#[derive(Debug, Deserialize)]
pub struct GetFirstAvailableBlockResponse(Slot);

impl From<GetFirstAvailableBlockResponse> for Slot {
    fn from(val: GetFirstAvailableBlockResponse) -> Self {
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
        let request = ClientRequest::new(GetFirstAvailableBlockRequest::NAME)
            .id(1)
            .params(GetFirstAvailableBlockRequest);

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getFirstAvailableBlock"}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{ "jsonrpc": "2.0", "result": 250000, "id": 1 }"#;

        let response: ClientResponse<GetFirstAvailableBlockResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");

        assert_eq!(response.result.0, 250000);
    }
}
