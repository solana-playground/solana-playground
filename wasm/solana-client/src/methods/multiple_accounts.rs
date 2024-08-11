use serde_tuple::Serialize_tuple;
use serde_with::{serde_as, skip_serializing_none, DisplayFromStr};
use solana_extra_wasm::account_decoder::UiAccount;
use solana_sdk::pubkey::Pubkey;

use super::Context;
use crate::{impl_method, utils::rpc_config::RpcAccountInfoConfig, ClientRequest, ClientResponse};

#[serde_as]
#[skip_serializing_none]
#[derive(Debug, Serialize_tuple)]
#[serde(rename_all = "camelCase")]
pub struct GetMultipleAccountsRequest {
    #[serde_as(as = "Vec<DisplayFromStr>")]
    pub addresses: Vec<Pubkey>,
    pub config: Option<RpcAccountInfoConfig>,
}

impl_method!(GetMultipleAccountsRequest, "getMultipleAccounts");

impl GetMultipleAccountsRequest {
    pub fn new(addresses: Vec<Pubkey>) -> Self {
        Self {
            addresses,
            config: None,
        }
    }
    pub fn new_with_config(addresses: Vec<Pubkey>, config: RpcAccountInfoConfig) -> Self {
        Self {
            addresses,
            config: Some(config),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetMultipleAccountsResponse {
    pub context: Context,
    pub value: Vec<Option<UiAccount>>,
}

#[cfg(test)]
mod tests {
    use serde_json::Value;
    use solana_extra_wasm::account_decoder::{UiAccountData, UiAccountEncoding};
    use solana_sdk::pubkey;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetMultipleAccountsRequest::NAME)
            .id(1)
            .params(GetMultipleAccountsRequest::new_with_config(
                vec![
                    pubkey!("vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg"),
                    pubkey!("4fYNw3dojWmQ4dXtSGE9epjRGy9pFSx62YypT7avPYvA"),
                ],
                RpcAccountInfoConfig {
                    encoding: Some(UiAccountEncoding::Base58),
                    ..Default::default()
                },
            ));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getMultipleAccounts","params":[["vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg","4fYNw3dojWmQ4dXtSGE9epjRGy9pFSx62YypT7avPYvA"],{"encoding":"base58"}]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":{"context":{"slot":1},"value":[{"data":["","base64"],"executable":false,"lamports":1000000000,"owner":"11111111111111111111111111111111","rentEpoch":2,"space":16},{"data":["","base64"],"executable":false,"lamports":5000000000,"owner":"11111111111111111111111111111111","rentEpoch":2,"space":0}]},"id":1}"#;

        let response: ClientResponse<GetMultipleAccountsResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(response.result.context.slot, 1);
        let value = response.result.value;
        assert_eq!(
            value,
            vec![
                Some(UiAccount {
                    lamports: 1000000000,
                    space: Some(16),
                    data: UiAccountData::Binary(String::new(), UiAccountEncoding::Base64),
                    owner: "11111111111111111111111111111111".to_string(),
                    executable: false,
                    rent_epoch: 2
                }),
                Some(UiAccount {
                    lamports: 5000000000,
                    space: Some(0),
                    data: UiAccountData::Binary(String::new(), UiAccountEncoding::Base64),
                    owner: "11111111111111111111111111111111".to_string(),
                    executable: false,
                    rent_epoch: 2
                })
            ]
        )
    }
}
