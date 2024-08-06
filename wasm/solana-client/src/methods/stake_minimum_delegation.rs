use serde_tuple::Serialize_tuple;
use serde_with::skip_serializing_none;
use solana_sdk::commitment_config::CommitmentConfig;

use crate::impl_method;

use super::Context;

#[skip_serializing_none]
#[derive(Debug, Serialize_tuple)]
pub struct GetStakeMinimumDelegationRequest {
    config: Option<CommitmentConfig>,
}

impl_method!(
    GetStakeMinimumDelegationRequest,
    "getStakeMinimumDelegation"
);

impl GetStakeMinimumDelegationRequest {
    pub fn new() -> Self {
        Self { config: None }
    }

    pub fn new_with_config(config: CommitmentConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetStakeMinimumDelegationResponse {
    pub context: Context,
    pub value: u64,
}

#[cfg(test)]
mod tests {
    use serde_json::Value;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetStakeMinimumDelegationRequest::NAME)
            .id(1)
            .params(GetStakeMinimumDelegationRequest::new());

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getStakeMinimumDelegation"}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json =
            r#"{"jsonrpc":"2.0","result":{"context":{"slot":501},"value":1000000000},"id":1}"#;

        let response: ClientResponse<GetStakeMinimumDelegationResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(response.result.context.slot, 501);
        assert_eq!(response.result.value, 1000000000);
    }
}
