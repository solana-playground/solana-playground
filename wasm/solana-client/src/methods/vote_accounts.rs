use serde_tuple::Serialize_tuple;
use serde_with::skip_serializing_none;

use crate::{
    impl_method,
    utils::{rpc_config::RpcGetVoteAccountsConfig, rpc_response::RpcVoteAccountStatus},
    ClientRequest, ClientResponse,
};

#[skip_serializing_none]
#[derive(Debug, Default, Serialize_tuple)]
pub struct GetVoteAccountsRequest {
    pub config: Option<RpcGetVoteAccountsConfig>,
}

impl_method!(GetVoteAccountsRequest, "getVoteAccounts");

impl GetVoteAccountsRequest {
    pub fn new() -> Self {
        Self::default()
    }
    pub fn new_with_config(config: RpcGetVoteAccountsConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetVoteAccountsResponse(RpcVoteAccountStatus);

impl From<GetVoteAccountsResponse> for RpcVoteAccountStatus {
    fn from(value: GetVoteAccountsResponse) -> Self {
        value.0
    }
}

#[cfg(test)]
mod tests {
    use serde_json::Value;

    use crate::{
        methods::Method, utils::rpc_response::RpcVoteAccountInfo, ClientRequest, ClientResponse,
    };

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetVoteAccountsRequest::NAME)
            .id(1)
            .params(GetVoteAccountsRequest::new_with_config(
                RpcGetVoteAccountsConfig {
                    vote_pubkey: Some("3ZT31jkAGhUaw8jsy4bTknwBMP8i4Eueh52By4zXcsVw".to_string()),
                    ..Default::default()
                },
            ));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getVoteAccounts","params":[{"votePubkey":"3ZT31jkAGhUaw8jsy4bTknwBMP8i4Eueh52By4zXcsVw"}]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":{"current":[{"commission":0,"epochVoteAccount":true,"epochCredits":[[1,64,0],[2,192,64]],"nodePubkey":"B97CCUW3AEZFGy6uUg6zUdnNYvnVq5VG8PUtb2HayTDD","lastVote":147,"activatedStake":42,"votePubkey":"3ZT31jkAGhUaw8jsy4bTknwBMP8i4Eueh52By4zXcsVw"}],"delinquent":[]},"id":1}"#;

        let response: ClientResponse<GetVoteAccountsResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(
            response.result.0,
            RpcVoteAccountStatus {
                current: vec![RpcVoteAccountInfo {
                    activated_stake: 42,
                    vote_pubkey: "3ZT31jkAGhUaw8jsy4bTknwBMP8i4Eueh52By4zXcsVw".to_string(),
                    node_pubkey: "B97CCUW3AEZFGy6uUg6zUdnNYvnVq5VG8PUtb2HayTDD".to_string(),
                    commission: 0,
                    epoch_vote_account: true,
                    epoch_credits: vec![(1, 64, 0), (2, 192, 64)],
                    last_vote: 147,
                    root_slot: 0
                }],
                delinquent: vec![]
            }
        );
    }
}
