use serde_tuple::Serialize_tuple;
use serde_with::skip_serializing_none;

use crate::{impl_method, utils::rpc_config::RpcContextConfig, ClientRequest, ClientResponse};

#[skip_serializing_none]
#[derive(Debug, Default, Serialize_tuple)]

pub struct GetTransactionCountRequest {
    pub config: Option<RpcContextConfig>,
}

impl_method!(GetTransactionCountRequest, "getTransactionCount");

impl GetTransactionCountRequest {
    pub fn new() -> Self {
        Self::default()
    }
    pub fn new_with_config(config: RpcContextConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetTransactionCountResponse(u64);

impl From<GetTransactionCountResponse> for u64 {
    fn from(val: GetTransactionCountResponse) -> Self {
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
        let request = ClientRequest::new(GetTransactionCountRequest::NAME)
            .id(1)
            .params(GetTransactionCountRequest::new());

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1, "method":"getTransactionCount"}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{ "jsonrpc": "2.0", "result": 268, "id": 1 }"#;

        let response: ClientResponse<GetTransactionCountResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(response.result.0, 268);
    }
}
