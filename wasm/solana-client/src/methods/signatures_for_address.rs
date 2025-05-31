use serde_tuple::Serialize_tuple;
use serde_with::{serde_as, skip_serializing_none, DisplayFromStr};
use solana_sdk::pubkey::Pubkey;

use crate::{
    impl_method,
    utils::{
        rpc_config::RpcSignaturesForAddressConfig,
        rpc_response::RpcConfirmedTransactionStatusWithSignature,
    },
    ClientRequest, ClientResponse,
};

#[serde_as]
#[skip_serializing_none]
#[derive(Debug, Serialize_tuple)]
pub struct GetSignaturesForAddressRequest {
    #[serde_as(as = "DisplayFromStr")]
    pubkey: Pubkey,
    config: Option<RpcSignaturesForAddressConfig>,
}

impl_method!(GetSignaturesForAddressRequest, "getSignaturesForAddress");

impl GetSignaturesForAddressRequest {
    pub fn new(pubkey: Pubkey) -> Self {
        Self {
            pubkey,
            config: None,
        }
    }

    pub fn new_with_config(pubkey: Pubkey, config: RpcSignaturesForAddressConfig) -> Self {
        Self {
            pubkey,
            config: Some(config),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetSignaturesForAddressResponse(Vec<RpcConfirmedTransactionStatusWithSignature>);

impl From<GetSignaturesForAddressResponse> for Vec<RpcConfirmedTransactionStatusWithSignature> {
    fn from(val: GetSignaturesForAddressResponse) -> Self {
        val.0
    }
}

#[cfg(test)]
mod tests {
    use serde_json::Value;
    use solana_sdk::pubkey;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetSignaturesForAddressRequest::NAME)
            .id(1)
            .params(GetSignaturesForAddressRequest::new_with_config(
                pubkey!("Vote111111111111111111111111111111111111111"),
                RpcSignaturesForAddressConfig {
                    limit: Some(1),
                    ..Default::default()
                },
            ));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getSignaturesForAddress","params":["Vote111111111111111111111111111111111111111",{"limit":1}]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":[{"err":null,"memo":null,"signature":"5h6xBEauJ3PK6SWCZ1PGjBvj8vDdWG3KpwATGy1ARAXFSDwt8GFXM7W5Ncn16wmqokgpiKRLuS83KUxyZyv2sUYv","slot":114,"blockTime":null}],"id":1}"#;

        let response: ClientResponse<GetSignaturesForAddressResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(response.result.0, vec![RpcConfirmedTransactionStatusWithSignature {block_time:None,err:None,memo:None,slot:114,signature:"5h6xBEauJ3PK6SWCZ1PGjBvj8vDdWG3KpwATGy1ARAXFSDwt8GFXM7W5Ncn16wmqokgpiKRLuS83KUxyZyv2sUYv".to_string(), confirmation_status: None}]);
    }
}
