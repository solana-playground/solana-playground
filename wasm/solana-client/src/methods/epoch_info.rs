use serde_tuple::Serialize_tuple;
use serde_with::skip_serializing_none;
use solana_sdk::{commitment_config::CommitmentConfig, epoch_info::EpochInfo};

use crate::{impl_method, ClientRequest, ClientResponse};

#[skip_serializing_none]
#[derive(Debug, Serialize_tuple, Default)]
pub struct GetEpochInfoRequest {
    pub config: Option<CommitmentConfig>,
}

impl_method!(GetEpochInfoRequest, "getEpochInfo");

impl GetEpochInfoRequest {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn new_with_config(config: CommitmentConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetEpochInfoResponse(EpochInfo);

impl From<GetEpochInfoResponse> for EpochInfo {
    fn from(value: GetEpochInfoResponse) -> Self {
        value.0
    }
}

#[cfg(test)]
mod tests {
    use serde_json::Value;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetEpochInfoRequest::NAME)
            .id(1)
            .params(GetEpochInfoRequest::new());

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1, "method":"getEpochInfo"}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":{"absoluteSlot":166598,"blockHeight":166500,"epoch":27,"slotIndex":2790,"slotsInEpoch":8192,"transactionCount":22661093},"id":1}"#;

        let response: ClientResponse<GetEpochInfoResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(
            response.result.0,
            EpochInfo {
                absolute_slot: 166598,
                block_height: 166500,
                epoch: 27,
                slot_index: 2790,
                slots_in_epoch: 8192,
                transaction_count: Some(22661093)
            }
        );
    }
}
