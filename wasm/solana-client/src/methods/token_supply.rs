use serde_tuple::Serialize_tuple;
use serde_with::{serde_as, skip_serializing_none, DisplayFromStr};
use solana_extra_wasm::account_decoder::parse_token::UiTokenAmount;
use solana_sdk::{commitment_config::CommitmentConfig, pubkey::Pubkey};

use super::Context;
use crate::{impl_method, ClientRequest, ClientResponse};

#[serde_as]
#[skip_serializing_none]
#[derive(Debug, Serialize_tuple)]
pub struct GetTokenSupplyRequest {
    #[serde_as(as = "DisplayFromStr")]
    pub pubkey: Pubkey,
    pub config: Option<CommitmentConfig>,
}

impl_method!(GetTokenSupplyRequest, "getTokenSupply");

impl GetTokenSupplyRequest {
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

#[derive(Debug, Deserialize)]
pub struct GetTokenSupplyResponse {
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
        let request = ClientRequest::new(GetTokenSupplyRequest::NAME)
            .id(1)
            .params(GetTokenSupplyRequest::new(pubkey!(
                "3wyAj7Rt1TWVPZVteFJPLa26JmLvdb1CAKEFZm3NY75E"
            )));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getTokenSupply","params":["3wyAj7Rt1TWVPZVteFJPLa26JmLvdb1CAKEFZm3NY75E"]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":{"context":{"slot":1114},"value":{"amount":"100000","decimals":2,"uiAmount":1000,"uiAmountString":"1000"}},"id":1}"#;

        let response: ClientResponse<GetTokenSupplyResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(response.result.context.slot, 1114);
        assert_eq!(
            response.result.value,
            UiTokenAmount {
                amount: "100000".to_string(),
                ui_amount_string: "1000".to_string(),
                decimals: 2,
                ui_amount: Some(1000.0)
            }
        );
    }
}
