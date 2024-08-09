use serde_tuple::Serialize_tuple;
use serde_with::skip_serializing_none;
use solana_sdk::commitment_config::CommitmentConfig;

use crate::{impl_method, ClientResponse};

#[skip_serializing_none]
#[derive(Debug, Serialize_tuple)]
pub struct GetMinimumBalanceForRentExemptionRequest {
    pub data_length: usize,
    pub config: Option<CommitmentConfig>,
}

impl_method!(
    GetMinimumBalanceForRentExemptionRequest,
    "getMinimumBalanceForRentExemption"
);

impl GetMinimumBalanceForRentExemptionRequest {
    pub fn new(data_length: usize) -> Self {
        Self {
            data_length,
            config: None,
        }
    }
    pub fn new_with_config(data_length: usize, config: CommitmentConfig) -> Self {
        Self {
            data_length,
            config: Some(config),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetMinimumBalanceForRentExemptionResponse(u64);

impl From<GetMinimumBalanceForRentExemptionResponse> for u64 {
    fn from(val: GetMinimumBalanceForRentExemptionResponse) -> Self {
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
        let request = ClientRequest::new(GetMinimumBalanceForRentExemptionRequest::NAME)
            .id(1)
            .params(GetMinimumBalanceForRentExemptionRequest::new(50));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getMinimumBalanceForRentExemption","params":[50]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{ "jsonrpc": "2.0", "result": 500, "id": 1 }"#;

        let response: ClientResponse<GetMinimumBalanceForRentExemptionResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(response.result.0, 500);
    }
}
