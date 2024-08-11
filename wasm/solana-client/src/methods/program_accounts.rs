use serde_tuple::Serialize_tuple;
use serde_with::{serde_as, skip_serializing_none, DisplayFromStr};
use solana_sdk::pubkey::Pubkey;

use crate::{
    impl_method,
    utils::rpc_config::{RpcKeyedAccount, RpcProgramAccountsConfig},
    ClientRequest, ClientResponse,
};

#[serde_as]
#[skip_serializing_none]
#[derive(Debug, Serialize_tuple)]
pub struct GetProgramAccountsRequest {
    #[serde_as(as = "DisplayFromStr")]
    pub pubkey: Pubkey,
    pub config: Option<RpcProgramAccountsConfig>,
}

impl_method!(GetProgramAccountsRequest, "getProgramAccounts");

impl GetProgramAccountsRequest {
    pub fn new(pubkey: Pubkey) -> Self {
        Self {
            pubkey,
            config: None,
        }
    }

    pub fn new_with_config(pubkey: Pubkey, config: RpcProgramAccountsConfig) -> Self {
        Self {
            pubkey,
            config: Some(config),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetProgramAccountsResponse(Option<Vec<RpcKeyedAccount>>);

impl GetProgramAccountsResponse {
    pub fn keyed_accounts(&self) -> Option<&Vec<RpcKeyedAccount>> {
        self.0.as_ref()
    }
}

#[cfg(test)]
mod tests {
    use serde_json::Value;
    use solana_extra_wasm::account_decoder::{UiAccount, UiAccountData};
    use solana_sdk::pubkey;

    use crate::{
        methods::Method,
        utils::{
            rpc_config::RpcAccountInfoConfig,
            rpc_filter::{Memcmp, MemcmpEncodedBytes, RpcFilterType},
        },
        ClientRequest, ClientResponse,
    };

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetProgramAccountsRequest::NAME)
            .id(1)
            .params(GetProgramAccountsRequest::new_with_config(
                pubkey!("4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T"),
                RpcProgramAccountsConfig {
                    filters: Some(vec![
                        RpcFilterType::DataSize(17),
                        RpcFilterType::Memcmp(Memcmp {
                            offset: 4,
                            bytes: MemcmpEncodedBytes::Base64("3Mc6vR".to_string()),
                            encoding: None,
                        }),
                    ]),
                    account_config: RpcAccountInfoConfig::default(),
                    with_context: None,
                },
            ));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getProgramAccounts","params":["4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T",{"filters":[{"dataSize":17},{"memcmp":{"offset":4,"bytes":"3Mc6vR"}}]}]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":[{"account":{"data":"2R9jLfiAQ9bgdcw6h8s44439","executable":false,"lamports":15298080,"owner":"4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T","rentEpoch":28,"space":42},"pubkey":"CxELquR1gPP8wHe33gZ4QxqGB3sZ9RSwsJ2KshVewkFY"}],"id":1}"#;

        let response: ClientResponse<GetProgramAccountsResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        let value = response.result.0.unwrap();
        assert_eq!(
            value,
            vec![RpcKeyedAccount {
                account: UiAccount {
                    executable: false,
                    data: UiAccountData::LegacyBinary("2R9jLfiAQ9bgdcw6h8s44439".to_string()),
                    lamports: 15298080,
                    owner: "4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T".to_string(),
                    rent_epoch: 28,
                    space: Some(42)
                },
                pubkey: "CxELquR1gPP8wHe33gZ4QxqGB3sZ9RSwsJ2KshVewkFY".to_string()
            }]
        )
    }
}
