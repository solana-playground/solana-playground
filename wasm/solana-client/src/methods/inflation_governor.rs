use serde_tuple::Serialize_tuple;
use serde_with::skip_serializing_none;
use solana_sdk::commitment_config::CommitmentConfig;

use crate::{
    impl_method, utils::rpc_response::RpcInflationGovernor, ClientRequest, ClientResponse,
};

#[skip_serializing_none]
#[derive(Debug, Default, Serialize_tuple)]
pub struct GetInflationGovernorRequest {
    pub config: Option<CommitmentConfig>,
}

impl_method!(GetInflationGovernorRequest, "getInflationGovernor");

impl GetInflationGovernorRequest {
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
pub struct GetInflationGovernorResponse(RpcInflationGovernor);

impl From<GetInflationGovernorResponse> for RpcInflationGovernor {
    fn from(value: GetInflationGovernorResponse) -> Self {
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
        let request = ClientRequest::new(GetInflationGovernorRequest::NAME)
            .id(1)
            .params(GetInflationGovernorRequest::new());

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1, "method":"getInflationGovernor"}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":{"foundation":0.05,"foundationTerm":7,"initial":0.15,"taper":0.15,"terminal":0.015},"id":1}"#;

        let response: ClientResponse<GetInflationGovernorResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        let value = response.result.0;
        assert_eq!(value.foundation, 0.05);
        assert_eq!(value.foundation_term, 7.0);
        assert_eq!(value.initial, 0.15);
        assert_eq!(value.taper, 0.15);
        assert_eq!(value.terminal, 0.015);
    }
}
