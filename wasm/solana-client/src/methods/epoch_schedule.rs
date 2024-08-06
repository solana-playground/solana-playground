use solana_sdk::epoch_schedule::EpochSchedule;

use crate::{impl_method, ClientResponse};

#[derive(Debug, Serialize)]
pub struct GetEpochScheduleRequest;

impl_method!(GetEpochScheduleRequest, "getEpochSchedule");

#[derive(Debug, Deserialize)]
pub struct GetEpochScheduleResponse(EpochSchedule);

impl From<GetEpochScheduleResponse> for EpochSchedule {
    fn from(value: GetEpochScheduleResponse) -> Self {
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
        let request = ClientRequest::new(GetEpochScheduleRequest::NAME)
            .id(1)
            .params(GetEpochScheduleRequest);

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getEpochSchedule"}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":{"firstNormalEpoch":8,"firstNormalSlot":8160,"leaderScheduleSlotOffset":8192,"slotsPerEpoch":8192,"warmup":true},"id":1}"#;

        let response: ClientResponse<GetEpochScheduleResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");

        let value = response.result.0;
        assert_eq!(value.first_normal_epoch, 8);
        assert_eq!(value.first_normal_slot, 8160);
        assert_eq!(value.leader_schedule_slot_offset, 8192);
        assert_eq!(value.slots_per_epoch, 8192);
        assert!(value.warmup);
    }
}
