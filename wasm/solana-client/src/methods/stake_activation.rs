use serde_tuple::Serialize_tuple;
use serde_with::{serde_as, skip_serializing_none, DisplayFromStr};
use solana_sdk::pubkey::Pubkey;

use crate::{
    impl_method,
    utils::{rpc_config::RpcEpochConfig, rpc_response::RpcStakeActivation},
    ClientRequest, ClientResponse,
};

#[serde_as]
#[skip_serializing_none]
#[derive(Debug, Serialize_tuple)]
pub struct GetStakeActivationRequest {
    #[serde_as(as = "DisplayFromStr")]
    pubkey: Pubkey,
    config: Option<RpcEpochConfig>,
}

impl_method!(GetStakeActivationRequest, "getStakeActivation");

impl GetStakeActivationRequest {
    pub fn new(pubkey: Pubkey) -> Self {
        Self {
            pubkey,
            config: None,
        }
    }

    pub fn new_with_config(pubkey: Pubkey, config: RpcEpochConfig) -> Self {
        Self {
            pubkey,
            config: Some(config),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetStakeActivationResponse(RpcStakeActivation);

impl From<GetStakeActivationResponse> for RpcStakeActivation {
    fn from(value: GetStakeActivationResponse) -> Self {
        value.0
    }
}

#[cfg(test)]
mod tests {
    use serde_json::Value;
    use solana_sdk::pubkey;

    use crate::{
        methods::Method, utils::rpc_response::StakeActivationState, ClientRequest, ClientResponse,
    };

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetStakeActivationRequest::NAME)
            .id(1)
            .params(GetStakeActivationRequest::new_with_config(
                pubkey!("CYRJWqiSjLitBAcRxPvWpgX3s5TvmN2SuRY3eEYypFvT"),
                RpcEpochConfig {
                    epoch: Some(4),
                    ..Default::default()
                },
            ));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getStakeActivation","params":["CYRJWqiSjLitBAcRxPvWpgX3s5TvmN2SuRY3eEYypFvT",{"epoch":4}]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":{"active":124429280,"inactive":73287840,"state":"activating"},"id":1}"#;

        let response: ClientResponse<GetStakeActivationResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(
            response.result.0,
            RpcStakeActivation {
                active: 124429280,
                inactive: 73287840,
                state: StakeActivationState::Activating
            }
        );
    }
}
