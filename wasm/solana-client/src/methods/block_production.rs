use serde::Deserialize;
use serde_tuple::Serialize_tuple;
use serde_with::skip_serializing_none;

use super::Context;
use crate::{
    impl_method,
    utils::{rpc_config::RpcBlockProductionConfig, rpc_response::RpcBlockProduction},
    ClientRequest, ClientResponse,
};

#[skip_serializing_none]
#[derive(Debug, Serialize_tuple, Default)]
pub struct GetBlockProductionRequest {
    pub config: Option<RpcBlockProductionConfig>,
}

impl_method!(GetBlockProductionRequest, "getBlockProduction");

impl GetBlockProductionRequest {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn new_with_config(config: RpcBlockProductionConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetBlockProductionResponse {
    pub context: Context,
    pub value: RpcBlockProduction,
}

#[cfg(test)]
mod tests {
    use serde_json::Value;
    use std::collections::HashMap;

    use crate::{
        methods::Method, utils::rpc_response::RpcBlockProductionRange, ClientRequest,
        ClientResponse,
    };

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetBlockProductionRequest::NAME)
            .id(1)
            .params(GetBlockProductionRequest::new());

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1, "method":"getBlockProduction"}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":{"context":{"slot":9887},"value":{"byIdentity":{"85iYT5RuzRTDgjyRa3cP8SYhM2j21fj7NhfJ3peu1DPr":[9888,9886]},"range":{"firstSlot":0,"lastSlot":9887}}},"id":1}"#;

        let response: ClientResponse<GetBlockProductionResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(response.result.context.slot, 9887);

        let value = response.result.value;
        assert_eq!(
            value.by_identity,
            HashMap::from_iter([(
                "85iYT5RuzRTDgjyRa3cP8SYhM2j21fj7NhfJ3peu1DPr".to_string(),
                (9888, 9886)
            )])
        );
        assert_eq!(
            value.range,
            RpcBlockProductionRange {
                first_slot: 0,
                last_slot: 9887
            }
        )
    }
}
