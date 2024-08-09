use serde_tuple::Serialize_tuple;
use serde_with::{serde_as, DisplayFromStr};
use solana_sdk::{commitment_config::CommitmentConfig, pubkey::Pubkey};
use std::str::FromStr;

use crate::{impl_method, ClientRequest, ClientResponse};

#[derive(Debug, Default, Serialize_tuple)]
pub struct GetSlotLeaderRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<CommitmentConfig>,
}

impl_method!(GetSlotLeaderRequest, "getSlotLeader");

impl GetSlotLeaderRequest {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn new_with_config(config: CommitmentConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

#[serde_as]
#[derive(Debug, Deserialize)]
pub struct GetSlotLeaderResponse(#[serde_as(as = "DisplayFromStr")] Pubkey);

impl From<GetSlotLeaderResponse> for Pubkey {
    fn from(val: GetSlotLeaderResponse) -> Self {
        val.0
    }
}

#[cfg(test)]
mod tests {
    use serde_json::Value;
    use solana_sdk::pubkey;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetSlotLeaderRequest::NAME)
            .id(1)
            .params(GetSlotLeaderRequest::new());

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1, "method":"getSlotLeader"}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json =
            r#"{"jsonrpc":"2.0","result":"ENvAW7JScgYq6o4zKZwewtkzzJgDzuJAFxYasvmEQdpS","id":1}"#;

        let response: ClientResponse<GetSlotLeaderResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(
            response.result.0,
            pubkey!("ENvAW7JScgYq6o4zKZwewtkzzJgDzuJAFxYasvmEQdpS")
        );
    }
}
