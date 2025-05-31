use crate::{impl_method, ClientRequest, ClientResponse};

#[derive(Debug, Serialize)]
pub struct GetGenesisHashRequest;

impl_method!(GetGenesisHashRequest, "getGenesisHash");

#[derive(Debug, Deserialize)]
pub struct GetGenesisHashResponse(String);

impl From<GetGenesisHashResponse> for String {
    fn from(val: GetGenesisHashResponse) -> Self {
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
        let request = ClientRequest::new(GetGenesisHashRequest::NAME)
            .id(1)
            .params(GetGenesisHashRequest);

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1, "method":"getGenesisHash"}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json =
            r#"{"jsonrpc":"2.0","result":"GH7ome3EiwEr7tu9JuTh2dpYWBJK3z69Xm1ZE3MEE6JC","id":1}"#;

        let response: ClientResponse<GetGenesisHashResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");

        assert_eq!(
            response.result.0,
            "GH7ome3EiwEr7tu9JuTh2dpYWBJK3z69Xm1ZE3MEE6JC"
        );
    }
}
