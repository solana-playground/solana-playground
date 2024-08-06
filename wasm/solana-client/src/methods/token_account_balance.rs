use serde_tuple::Serialize_tuple;
use serde_with::{serde_as, skip_serializing_none, DisplayFromStr};
use solana_extra_wasm::account_decoder::parse_token::UiTokenAmount;
use solana_sdk::{commitment_config::CommitmentConfig, pubkey::Pubkey};

use super::Context;
use crate::{impl_method, ClientRequest, ClientResponse};

#[serde_as]
#[skip_serializing_none]
#[derive(Debug, Serialize_tuple)]
pub struct GetTokenAccountBalanceRequest {
    #[serde_as(as = "DisplayFromStr")]
    pub account: Pubkey,
    pub config: Option<CommitmentConfig>,
}

impl_method!(GetTokenAccountBalanceRequest, "getTokenAccountBalance");

impl GetTokenAccountBalanceRequest {
    pub fn new(account: Pubkey) -> Self {
        Self {
            account,
            config: None,
        }
    }

    pub fn new_with_config(account: Pubkey, config: CommitmentConfig) -> Self {
        Self {
            account,
            config: Some(config),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetTokenAccountBalanceResponse {
    pub context: Context,
    pub value: UiTokenAmount,
}

#[cfg(test)]
mod tests {
    use serde_json::Value;
    use solana_sdk::pubkey;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetTokenAccountBalanceRequest::NAME)
            .id(1)
            .params(GetTokenAccountBalanceRequest::new(pubkey!(
                "7fUAJdStEuGbc3sM84cKRL6yYaaSstyLSU4ve5oovLS7"
            )));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getTokenAccountBalance","params":["7fUAJdStEuGbc3sM84cKRL6yYaaSstyLSU4ve5oovLS7"]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":{"context":{"slot":1114},"value":{"amount":"9864","decimals":2,"uiAmount":98.64,"uiAmountString":"98.64"}},"id":1}"#;

        let response: ClientResponse<GetTokenAccountBalanceResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(response.result.context.slot, 1114);
        assert_eq!(
            response.result.value,
            UiTokenAmount {
                amount: "9864".to_string(),
                decimals: 2,
                ui_amount: Some(98.64),
                ui_amount_string: "98.64".to_string()
            }
        );
    }
}
