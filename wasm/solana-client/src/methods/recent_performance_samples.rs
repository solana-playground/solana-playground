use serde_tuple::Serialize_tuple;
use serde_with::skip_serializing_none;

use crate::{impl_method, utils::rpc_response::RpcPerfSample, ClientRequest, ClientResponse};

#[skip_serializing_none]
#[derive(Debug, Default, Serialize_tuple)]
pub struct GetRecentPerformanceSamplesRequest {
    pub limit: Option<usize>,
}

impl_method!(
    GetRecentPerformanceSamplesRequest,
    "getRecentPerformanceSamples"
);

impl GetRecentPerformanceSamplesRequest {
    pub fn new() -> Self {
        Self::default()
    }
    pub fn new_with_limit(limit: usize) -> Self {
        Self { limit: Some(limit) }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetRecentPerformanceSamplesResponse(Vec<RpcPerfSample>);

impl From<GetRecentPerformanceSamplesResponse> for Vec<RpcPerfSample> {
    fn from(val: GetRecentPerformanceSamplesResponse) -> Self {
        val.0
    }
}

#[cfg(test)]
mod tests {
    use serde_json::Value;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetRecentPerformanceSamplesRequest::NAME)
            .id(1)
            .params(GetRecentPerformanceSamplesRequest::new_with_limit(4));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json =
            r#"{"jsonrpc":"2.0","id":1,"method":"getRecentPerformanceSamples","params":[4]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":[{"numSlots":126,"numTransactions":126,"numNonVoteTransaction":1,"samplePeriodSecs":60,"slot":348125},{"numSlots":126,"numTransactions":126,"numNonVoteTransaction":1,"samplePeriodSecs":60,"slot":347999},{"numSlots":125,"numTransactions":125,"numNonVoteTransaction":0,"samplePeriodSecs":60,"slot":347873},{"numSlots":125,"numTransactions":125,"numNonVoteTransaction":0,"samplePeriodSecs":60,"slot":347748}],"id":1}"#;

        let response: ClientResponse<GetRecentPerformanceSamplesResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        let value = response.result.0;
        assert_eq!(
            value,
            vec![
                RpcPerfSample {
                    num_slots: 126,
                    num_transactions: 126,
                    slot: 348125,
                    sample_period_secs: 60,
                    num_non_vote_transaction: 1
                },
                RpcPerfSample {
                    num_slots: 126,
                    num_transactions: 126,
                    slot: 347999,
                    sample_period_secs: 60,
                    num_non_vote_transaction: 1
                },
                RpcPerfSample {
                    num_slots: 125,
                    num_transactions: 125,
                    slot: 347873,
                    sample_period_secs: 60,
                    num_non_vote_transaction: 0
                },
                RpcPerfSample {
                    num_slots: 125,
                    num_transactions: 125,
                    slot: 347748,
                    sample_period_secs: 60,
                    num_non_vote_transaction: 0
                }
            ]
        )
    }
}
