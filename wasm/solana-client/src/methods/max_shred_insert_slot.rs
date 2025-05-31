use crate::impl_method;

#[derive(Debug, Serialize)]
pub struct GetMaxShredInsertSlotRequest;

impl_method!(GetMaxShredInsertSlotRequest, "getMaxShredInsertSlot");

#[derive(Debug, Deserialize)]
pub struct GetMaxShredInsertSlotResponse(u64);

#[cfg(test)]
mod tests {
    use serde_json::Value;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetMaxShredInsertSlotRequest::NAME)
            .id(1)
            .params(GetMaxShredInsertSlotRequest);

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1, "method":"getMaxShredInsertSlot"}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{ "jsonrpc": "2.0", "result": 1234, "id": 1 }"#;

        let response: ClientResponse<GetMaxShredInsertSlotResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(response.result.0, 1234);
    }
}
