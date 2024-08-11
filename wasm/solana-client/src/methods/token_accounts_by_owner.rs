use serde_tuple::Serialize_tuple;
use serde_with::{serde_as, DisplayFromStr};
use solana_sdk::pubkey::Pubkey;

use super::Context;
use crate::{
    impl_method,
    utils::{
        rpc_config::{RpcAccountInfoConfig, RpcKeyedAccount},
        rpc_filter::RpcTokenAccountsFilter,
    },
    ClientRequest, ClientResponse,
};

#[serde_as]
#[derive(Debug, Serialize_tuple)]
pub struct GetTokenAccountsByOwnerRequest {
    #[serde_as(as = "DisplayFromStr")]
    pub owner: Pubkey,
    pub filter: RpcTokenAccountsFilter,
    pub config: Option<RpcAccountInfoConfig>,
}

impl_method!(GetTokenAccountsByOwnerRequest, "getTokenAccountsByOwner");

impl GetTokenAccountsByOwnerRequest {
    pub fn new(owner: Pubkey, filter: RpcTokenAccountsFilter) -> Self {
        Self {
            owner,
            filter,
            config: None,
        }
    }

    pub fn new_with_config(
        owner: Pubkey,
        filter: RpcTokenAccountsFilter,
        config: RpcAccountInfoConfig,
    ) -> Self {
        Self {
            owner,
            filter,
            config: Some(config),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetTokenAccountsByOwnerResponse {
    pub context: Context,
    pub value: Vec<RpcKeyedAccount>,
}

#[cfg(test)]
mod tests {
    use serde_json::Value;
    use solana_extra_wasm::account_decoder::{
        ParsedAccount, UiAccount, UiAccountData, UiAccountEncoding,
    };
    use solana_sdk::pubkey;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetTokenAccountsByOwnerRequest::NAME)
            .id(1)
            .params(GetTokenAccountsByOwnerRequest::new_with_config(
                pubkey!("4Qkev8aNZcqFNSRhQzwyLMFSsi94jHqE8WNVTJzTP99F"),
                RpcTokenAccountsFilter::Mint(pubkey!(
                    "3wyAj7Rt1TWVPZVteFJPLa26JmLvdb1CAKEFZm3NY75E"
                )),
                RpcAccountInfoConfig {
                    encoding: Some(UiAccountEncoding::JsonParsed),
                    ..Default::default()
                },
            ));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getTokenAccountsByOwner","params":["4Qkev8aNZcqFNSRhQzwyLMFSsi94jHqE8WNVTJzTP99F",{"mint":"3wyAj7Rt1TWVPZVteFJPLa26JmLvdb1CAKEFZm3NY75E"},{"encoding":"jsonParsed"}]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":{"context":{"slot":1114},"value":[{"account":{"data":{"program":"spl-token","parsed":{"accountType":"account","info":{"tokenAmount":{"amount":"1","decimals":1,"uiAmount":0.1,"uiAmountString":"0.1"},"delegate":"4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T","delegatedAmount":{"amount":"1","decimals":1,"uiAmount":0.1,"uiAmountString":"0.1"},"state":"initialized","isNative":false,"mint":"3wyAj7Rt1TWVPZVteFJPLa26JmLvdb1CAKEFZm3NY75E","owner":"4Qkev8aNZcqFNSRhQzwyLMFSsi94jHqE8WNVTJzTP99F"},"type":"account"},"space":165},"executable":false,"lamports":1726080,"owner":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA","rentEpoch":4,"space":165},"pubkey":"C2gJg6tKpQs41PRS1nC8aw3ZKNZK3HQQZGVrDFDup5nx"}]},"id":1}"#;

        let response: ClientResponse<GetTokenAccountsByOwnerResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(response.result.context.slot, 1114);
        assert_eq!(
            response.result.value,
            vec![RpcKeyedAccount {
                account: UiAccount {
                    owner: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA".to_string(),
                    data: UiAccountData::Json(ParsedAccount {
                        program: "spl-token".to_string(),
                        space: 165,
                        parsed: serde_json::from_str(r#"{"accountType":"account","info":{"tokenAmount":{"amount":"1","decimals":1,"uiAmount":0.1,"uiAmountString":"0.1"},"delegate":"4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T","delegatedAmount":{"amount":"1","decimals":1,"uiAmount":0.1,"uiAmountString":"0.1"},"state":"initialized","isNative":false,"mint":"3wyAj7Rt1TWVPZVteFJPLa26JmLvdb1CAKEFZm3NY75E","owner":"4Qkev8aNZcqFNSRhQzwyLMFSsi94jHqE8WNVTJzTP99F"},"type":"account"}"#).unwrap()
                    }),
                    executable: false,
                    lamports: 1726080,
                    rent_epoch: 4,
                    space: Some(165)
                },
                pubkey: "C2gJg6tKpQs41PRS1nC8aw3ZKNZK3HQQZGVrDFDup5nx".to_string()
            }]
        );
    }
}
