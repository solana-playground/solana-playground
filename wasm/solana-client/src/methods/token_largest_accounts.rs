use serde_tuple::Serialize_tuple;
use serde_with::{serde_as, skip_serializing_none, DisplayFromStr};
use solana_sdk::{commitment_config::CommitmentConfig, pubkey::Pubkey};

use super::Context;
use crate::{impl_method, ClientRequest, ClientResponse};

#[serde_as]
#[skip_serializing_none]
#[derive(Debug, Serialize_tuple)]
pub struct GetTokenLargestAccountsRequest {
    #[serde_as(as = "DisplayFromStr")]
    pub pubkey: Pubkey,
    pub config: Option<CommitmentConfig>,
}

impl_method!(GetTokenLargestAccountsRequest, "getTokenLargestAccounts");

impl GetTokenLargestAccountsRequest {
    pub fn new(pubkey: Pubkey) -> Self {
        Self {
            pubkey,
            config: None,
        }
    }
    pub fn new_with_config(pubkey: Pubkey, config: CommitmentConfig) -> Self {
        Self {
            pubkey,
            config: Some(config),
        }
    }
}

#[serde_as]
#[derive(Debug, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TokenLargestAccountsValue {
    #[serde_as(as = "DisplayFromStr")]
    pub address: Pubkey,
    pub amount: String,
    pub decimals: u8,
    pub ui_amount: Option<f64>,
    pub ui_amount_string: String,
}

#[derive(Debug, Deserialize)]
pub struct GetTokenLargestAccountsResponse {
    pub context: Context,
    pub value: Vec<TokenLargestAccountsValue>,
}

#[cfg(test)]
mod tests {
    use serde_json::Value;
    use solana_sdk::pubkey;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetTokenLargestAccountsRequest::NAME)
            .id(1)
            .params(GetTokenLargestAccountsRequest::new(pubkey!(
                "3wyAj7Rt1TWVPZVteFJPLa26JmLvdb1CAKEFZm3NY75E"
            )));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getTokenLargestAccounts","params":["3wyAj7Rt1TWVPZVteFJPLa26JmLvdb1CAKEFZm3NY75E"]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":{"context":{"slot":1114},"value":[{"address":"FYjHNoFtSQ5uijKrZFyYAxvEr87hsKXkXcxkcmkBAf4r","amount":"771","decimals":2,"uiAmount":7.71,"uiAmountString":"7.71"},{"address":"BnsywxTcaYeNUtzrPxQUvzAWxfzZe3ZLUJ4wMMuLESnu","amount":"229","decimals":2,"uiAmount":2.29,"uiAmountString":"2.29"}]},"id":1}"#;

        let response: ClientResponse<GetTokenLargestAccountsResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(response.result.context.slot, 1114);
        assert_eq!(
            response.result.value,
            vec![
                TokenLargestAccountsValue {
                    address: pubkey!("FYjHNoFtSQ5uijKrZFyYAxvEr87hsKXkXcxkcmkBAf4r"),
                    amount: "771".to_string(),
                    ui_amount_string: "7.71".to_string(),
                    decimals: 2,
                    ui_amount: Some(7.71)
                },
                TokenLargestAccountsValue {
                    address: pubkey!("BnsywxTcaYeNUtzrPxQUvzAWxfzZe3ZLUJ4wMMuLESnu"),
                    amount: "229".to_string(),
                    ui_amount_string: "2.29".to_string(),
                    decimals: 2,
                    ui_amount: Some(2.29)
                }
            ]
        );
    }
}
