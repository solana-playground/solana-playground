use serde_tuple::Serialize_tuple;
use serde_with::{serde_as, DisplayFromStr};
use solana_sdk::pubkey::Pubkey;

use crate::{impl_method, utils::rpc_response::RpcPrioritizationFee};

#[serde_as]
#[derive(Debug, Serialize_tuple)]
pub struct GetRecentPrioritizationFeesRequest {
    #[serde_as(as = "Option<Vec<DisplayFromStr>>")]
    accounts: Option<Vec<Pubkey>>,
}

impl_method!(
    GetRecentPrioritizationFeesRequest,
    "getRecentPrioritizationFees"
);

impl GetRecentPrioritizationFeesRequest {
    pub fn new() -> Self {
        GetRecentPrioritizationFeesRequest { accounts: None }
    }

    pub fn new_with_accounts(accounts: Vec<Pubkey>) -> Self {
        GetRecentPrioritizationFeesRequest {
            accounts: Some(accounts),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetRecentPrioritizationFeesResponse(Vec<RpcPrioritizationFee>);

#[cfg(test)]
mod tests {
    use serde_json::Value;
    use solana_sdk::pubkey;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetRecentPrioritizationFeesRequest::NAME)
            .id(1)
            .params(GetRecentPrioritizationFeesRequest::new_with_accounts(vec![
                pubkey!("CxELquR1gPP8wHe33gZ4QxqGB3sZ9RSwsJ2KshVewkFY"),
            ]));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getRecentPrioritizationFees","params":[["CxELquR1gPP8wHe33gZ4QxqGB3sZ9RSwsJ2KshVewkFY"]]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":[{"slot":348125,"prioritizationFee":0},{"slot":348126,"prioritizationFee":1000},{"slot":348127,"prioritizationFee":500},{"slot":348128,"prioritizationFee":0},{"slot":348129,"prioritizationFee":1234}],"id":1}"#;

        let response: ClientResponse<GetRecentPrioritizationFeesResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(
            response.result.0,
            vec![
                RpcPrioritizationFee {
                    slot: 348125,
                    prioritization_fee: 0,
                },
                RpcPrioritizationFee {
                    slot: 348126,
                    prioritization_fee: 1000
                },
                RpcPrioritizationFee {
                    slot: 348127,
                    prioritization_fee: 500
                },
                RpcPrioritizationFee {
                    slot: 348128,
                    prioritization_fee: 0
                },
                RpcPrioritizationFee {
                    slot: 348129,
                    prioritization_fee: 1234
                }
            ]
        );
    }
}
