use serde::Deserialize;
use serde_tuple::Serialize_tuple;
use serde_with::{serde_as, skip_serializing_none, DisplayFromStr};
use solana_extra_wasm::account_decoder::{UiAccount, UiAccountEncoding};
use solana_sdk::pubkey::Pubkey;

use super::Context;
use crate::{impl_method, utils::rpc_config::RpcAccountInfoConfig, ClientRequest, ClientResponse};

#[serde_as]
#[derive(Debug, Serialize_tuple)]
pub struct GetAccountInfoRequest {
    #[serde_as(as = "DisplayFromStr")]
    pub pubkey: Pubkey,
    pub config: RpcAccountInfoConfig,
}

impl_method!(GetAccountInfoRequest, "getAccountInfo");

impl GetAccountInfoRequest {
    pub fn new(pubkey: Pubkey) -> Self {
        Self {
            pubkey,
            config: RpcAccountInfoConfig {
                encoding: Some(UiAccountEncoding::Base58),
                data_slice: None,
                commitment: None,
                min_context_slot: None,
            },
        }
    }
    pub fn new_with_config(pubkey: Pubkey, config: RpcAccountInfoConfig) -> Self {
        Self { pubkey, config }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetAccountInfoResponse {
    pub context: Context,
    pub value: Option<UiAccount>,
}

#[cfg(test)]
mod tests {
    use serde_json::Value;
    use solana_extra_wasm::account_decoder::UiAccountData;
    use solana_sdk::pubkey;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let pubkey = pubkey!("vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg");
        let request = ClientRequest::new(GetAccountInfoRequest::NAME)
            .id(1)
            .params(GetAccountInfoRequest::new(pubkey));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getAccountInfo","params":["vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg",{"encoding":"base58"}]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":{"context":{"slot":1},"value":{"data":["11116bv5nS2h3y12kD1yUKeMZvGcKLSjQgX6BeV7u1FrjeJcKfsHRTPuR3oZ1EioKtYGiYxpxMG5vpbZLsbcBYBEmZZcMKaSoGx9JZeAuWf","base58"],"executable":false,"lamports":1000000000,"owner":"11111111111111111111111111111111","rentEpoch":2,"space":80}},"id":1}"#;

        let response: ClientResponse<GetAccountInfoResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(response.result.context.slot, 1);

        let value = response.result.value.unwrap();
        assert!(!value.executable);
        assert_eq!(value.lamports, 1000000000);
        assert_eq!(value.owner, "11111111111111111111111111111111");
        assert_eq!(value.rent_epoch, 2);
        assert_eq!(value.space, Some(80));
        assert_eq!(value.data, UiAccountData::Binary("11116bv5nS2h3y12kD1yUKeMZvGcKLSjQgX6BeV7u1FrjeJcKfsHRTPuR3oZ1EioKtYGiYxpxMG5vpbZLsbcBYBEmZZcMKaSoGx9JZeAuWf".to_string(), UiAccountEncoding::Base58))
    }
}
