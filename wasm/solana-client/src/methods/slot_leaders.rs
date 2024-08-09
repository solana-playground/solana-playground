use serde_tuple::Serialize_tuple;
use serde_with::{serde_as, skip_serializing_none, DisplayFromStr};
use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;

use crate::{impl_method, ClientRequest, ClientResponse};

#[skip_serializing_none]
#[derive(Debug, Default, Serialize_tuple)]
pub struct GetSlotLeadersRequest {
    pub start_slot: Option<u64>,
    pub limit: Option<u64>,
}

impl_method!(GetSlotLeadersRequest, "getSlotLeaders");

impl GetSlotLeadersRequest {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn new_with_config(start_slot: u64, limit: u64) -> Self {
        Self {
            start_slot: Some(start_slot),
            limit: Some(limit),
        }
    }
}

#[serde_as]
#[derive(Debug, Deserialize)]
pub struct GetSlotLeadersResponse(#[serde_as(as = "Vec<DisplayFromStr>")] Vec<Pubkey>);

#[cfg(test)]
mod tests {
    use serde_json::Value;
    use solana_sdk::pubkey;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetSlotLeadersRequest::NAME)
            .id(1)
            .params(GetSlotLeadersRequest::new_with_config(100, 10));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getSlotLeaders","params":[100,10]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":["ChorusmmK7i1AxXeiTtQgQZhQNiXYU84ULeaYF1EH15n","ChorusmmK7i1AxXeiTtQgQZhQNiXYU84ULeaYF1EH15n","ChorusmmK7i1AxXeiTtQgQZhQNiXYU84ULeaYF1EH15n","ChorusmmK7i1AxXeiTtQgQZhQNiXYU84ULeaYF1EH15n","Awes4Tr6TX8JDzEhCZY2QVNimT6iD1zWHzf1vNyGvpLM","Awes4Tr6TX8JDzEhCZY2QVNimT6iD1zWHzf1vNyGvpLM","Awes4Tr6TX8JDzEhCZY2QVNimT6iD1zWHzf1vNyGvpLM","Awes4Tr6TX8JDzEhCZY2QVNimT6iD1zWHzf1vNyGvpLM","DWvDTSh3qfn88UoQTEKRV2JnLt5jtJAVoiCo3ivtMwXP","DWvDTSh3qfn88UoQTEKRV2JnLt5jtJAVoiCo3ivtMwXP"],"id":1}"#;

        let response: ClientResponse<GetSlotLeadersResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(
            response.result.0,
            vec![
                pubkey!("ChorusmmK7i1AxXeiTtQgQZhQNiXYU84ULeaYF1EH15n"),
                pubkey!("ChorusmmK7i1AxXeiTtQgQZhQNiXYU84ULeaYF1EH15n"),
                pubkey!("ChorusmmK7i1AxXeiTtQgQZhQNiXYU84ULeaYF1EH15n"),
                pubkey!("ChorusmmK7i1AxXeiTtQgQZhQNiXYU84ULeaYF1EH15n"),
                pubkey!("Awes4Tr6TX8JDzEhCZY2QVNimT6iD1zWHzf1vNyGvpLM"),
                pubkey!("Awes4Tr6TX8JDzEhCZY2QVNimT6iD1zWHzf1vNyGvpLM"),
                pubkey!("Awes4Tr6TX8JDzEhCZY2QVNimT6iD1zWHzf1vNyGvpLM"),
                pubkey!("Awes4Tr6TX8JDzEhCZY2QVNimT6iD1zWHzf1vNyGvpLM"),
                pubkey!("DWvDTSh3qfn88UoQTEKRV2JnLt5jtJAVoiCo3ivtMwXP"),
                pubkey!("DWvDTSh3qfn88UoQTEKRV2JnLt5jtJAVoiCo3ivtMwXP"),
            ]
        );
    }
}
