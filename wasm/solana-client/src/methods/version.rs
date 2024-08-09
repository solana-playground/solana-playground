use crate::{impl_method, utils::rpc_response::RpcVersionInfo, ClientRequest, ClientResponse};

#[derive(Debug, Serialize)]
pub struct GetVersionRequest;

impl_method!(GetVersionRequest, "getVersion");

#[derive(Debug, Deserialize)]
pub struct GetVersionResponse(RpcVersionInfo);

impl From<GetVersionResponse> for RpcVersionInfo {
    fn from(value: GetVersionResponse) -> Self {
        value.0
    }
}

#[cfg(test)]
mod tests {
    use serde_json::Value;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetVersionRequest::NAME)
            .id(1)
            .params(GetVersionRequest);

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1, "method":"getVersion"}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":{"feature-set":2891131721,"solana-core":"1.16.7"},"id":1}"#;

        let response: ClientResponse<GetVersionResponse> = serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(
            response.result.0,
            RpcVersionInfo {
                feature_set: Some(2891131721),
                solana_core: "1.16.7".to_string()
            }
        );
    }
}
