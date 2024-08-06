use crate::{impl_method, ClientRequest, ClientResponse};

#[derive(Debug, Serialize)]
pub struct GetHealthRequest;

impl_method!(GetHealthRequest, "getHealth");

#[derive(Debug, Deserialize)]
pub struct ErrorValue {
    pub code: i32,
    pub message: String,
    pub data: serde_json::Value,
}

#[derive(Debug, Deserialize)]
pub struct GetHealthResponse(String);

#[cfg(test)]
mod tests {
    use serde_json::Value;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetHealthRequest::NAME)
            .id(1)
            .params(GetHealthRequest);

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1, "method":"getHealth"}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{ "jsonrpc": "2.0", "result": "ok", "id": 1 }"#;

        let response: ClientResponse<GetHealthResponse> = serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(response.result.0, "ok");
    }
}
