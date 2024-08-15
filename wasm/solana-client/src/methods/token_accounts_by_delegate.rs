use serde_tuple::Serialize_tuple;
use serde_with::{serde_as, skip_serializing_none, DisplayFromStr};
use solana_extra_wasm::transaction_status::UiTransactionEncoding;
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
#[skip_serializing_none]
#[derive(Debug, Serialize_tuple)]
pub struct GetTokenAccountsByDelegateRequest {
    #[serde_as(as = "DisplayFromStr")]
    pub pubkey: Pubkey,
    pub filter: RpcTokenAccountsFilter,
    pub config: Option<RpcAccountInfoConfig>,
}

impl_method!(
    GetTokenAccountsByDelegateRequest,
    "getTokenAccountsByDelegate"
);

impl GetTokenAccountsByDelegateRequest {
    pub fn new_mint(pubkey: Pubkey, account_key: Pubkey) -> Self {
        Self {
            pubkey,
            filter: RpcTokenAccountsFilter::Mint(account_key),
            config: None,
        }
    }

    pub fn new_mint_with_config(
        pubkey: Pubkey,
        account_key: Pubkey,
        config: RpcAccountInfoConfig,
    ) -> Self {
        Self {
            pubkey,
            filter: RpcTokenAccountsFilter::Mint(account_key),
            config: Some(config),
        }
    }

    pub fn new_program(pubkey: Pubkey, account_key: Pubkey) -> Self {
        Self {
            pubkey,
            filter: RpcTokenAccountsFilter::ProgramId(account_key),
            config: None,
        }
    }

    pub fn new_program_with_config(
        pubkey: Pubkey,
        account_key: Pubkey,
        config: RpcAccountInfoConfig,
    ) -> Self {
        Self {
            pubkey,
            filter: RpcTokenAccountsFilter::ProgramId(account_key),
            config: Some(config),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetTokenAccountsByDelegateResponse {
    pub context: Context,
    pub value: Option<Vec<RpcKeyedAccount>>,
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
        let request = ClientRequest::new(GetTokenAccountsByDelegateRequest::NAME)
            .id(1)
            .params(GetTokenAccountsByDelegateRequest::new_program_with_config(
                pubkey!("4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T"),
                pubkey!("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
                RpcAccountInfoConfig {
                    encoding: Some(UiAccountEncoding::JsonParsed),
                    ..Default::default()
                },
            ));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getTokenAccountsByDelegate","params":["4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T",{"programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"encoding":"jsonParsed"}]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":{"context":{"slot":1114},"value":[{"account":{"data":{"program":"spl-token","parsed":{"info":{"tokenAmount":{"amount":"1","decimals":1,"uiAmount":0.1,"uiAmountString":"0.1"},"delegate":"4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T","delegatedAmount":{"amount":"1","decimals":1,"uiAmount":0.1,"uiAmountString":"0.1"},"state":"initialized","isNative":false,"mint":"3wyAj7Rt1TWVPZVteFJPLa26JmLvdb1CAKEFZm3NY75E","owner":"CnPoSPKXu7wJqxe59Fs72tkBeALovhsCxYeFwPCQH9TD"},"type":"account"},"space":165},"executable":false,"lamports":1726080,"owner":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA","rentEpoch":4,"space":165},"pubkey":"28YTZEwqtMHWrhWcvv34se7pjS7wctgqzCPB3gReCFKp"}]},"id":1}"#;

        let response: ClientResponse<GetTokenAccountsByDelegateResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(response.result.context.slot, 1114);
        assert_eq!(
            response.result.value,
            Some(
            vec![RpcKeyedAccount {
                account: UiAccount {
                    owner: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA".to_string(),
                    data: UiAccountData::Json(ParsedAccount {
                        program: "spl-token".to_string(),
                        space: 165,
                        parsed: serde_json::from_str(r#"{"info":{"tokenAmount":{"amount":"1","decimals":1,"uiAmount":0.1,"uiAmountString":"0.1"},"delegate":"4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T","delegatedAmount":{"amount":"1","decimals":1,"uiAmount":0.1,"uiAmountString":"0.1"},"state":"initialized","isNative":false,"mint":"3wyAj7Rt1TWVPZVteFJPLa26JmLvdb1CAKEFZm3NY75E","owner":"CnPoSPKXu7wJqxe59Fs72tkBeALovhsCxYeFwPCQH9TD"},"type":"account"}"#).unwrap()
                    }),
                    executable: false,
                    lamports: 1726080,
                    rent_epoch: 4,
                    space: Some(165)
                },
                pubkey: "28YTZEwqtMHWrhWcvv34se7pjS7wctgqzCPB3gReCFKp".to_string()
            }])
        );
    }
}
