use serde_tuple::Serialize_tuple;
use serde_with::{serde_as, skip_serializing_none, DisplayFromStr};
use solana_sdk::pubkey::Pubkey;

use crate::{
    impl_method,
    utils::{rpc_config::RpcEpochConfig, rpc_response::RpcInflationReward},
    ClientRequest, ClientResponse,
};

#[serde_as]
#[skip_serializing_none]
#[derive(Debug, Serialize_tuple)]
pub struct GetInflationRewardRequest {
    #[serde_as(as = "Vec<DisplayFromStr>")]
    pub addresses: Vec<Pubkey>,
    pub config: Option<RpcEpochConfig>,
}

impl_method!(GetInflationRewardRequest, "getInflationReward");

impl GetInflationRewardRequest {
    pub fn new(addresses: Vec<Pubkey>) -> Self {
        Self {
            addresses,
            config: None,
        }
    }
    pub fn new_with_config(addresses: Vec<Pubkey>, config: RpcEpochConfig) -> Self {
        Self {
            addresses,
            config: Some(config),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetInflationRewardResponse(Vec<Option<RpcInflationReward>>);

impl From<GetInflationRewardResponse> for Vec<Option<RpcInflationReward>> {
    fn from(value: GetInflationRewardResponse) -> Self {
        value.0
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
        let request = ClientRequest::new(GetInflationRewardRequest::NAME)
            .id(1)
            .params(GetInflationRewardRequest::new_with_config(
                vec![
                    pubkey!("6dmNQ5jwLeLk5REvio1JcMshcbvkYMwy26sJ8pbkvStu"),
                    pubkey!("BGsqMegLpV6n6Ve146sSX2dTjUMj3M92HnU8BbNRMhF2"),
                ],
                RpcEpochConfig {
                    epoch: Some(2),
                    ..Default::default()
                },
            ));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getInflationReward","params":[["6dmNQ5jwLeLk5REvio1JcMshcbvkYMwy26sJ8pbkvStu","BGsqMegLpV6n6Ve146sSX2dTjUMj3M92HnU8BbNRMhF2"],{"epoch":2}]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":[{"amount":2500,"effectiveSlot":224,"epoch":2,"postBalance":499999442500},null],"id":1}"#;

        let response: ClientResponse<GetInflationRewardResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        let value = response.result.0;
        assert_eq!(value.len(), 2);
        let inflation_reward = value[0].as_ref().unwrap();
        assert_eq!(inflation_reward.amount, 2500);
        assert_eq!(inflation_reward.effective_slot, 224);
        assert_eq!(inflation_reward.epoch, 2);
        assert_eq!(inflation_reward.post_balance, 499999442500);
    }
}
