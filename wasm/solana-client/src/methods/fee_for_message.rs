use serde::Serializer;
use serde_tuple::Serialize_tuple;
use serde_with::skip_serializing_none;
use solana_extra_wasm::transaction_status::UiTransactionEncoding;
use solana_sdk::{commitment_config::CommitmentConfig, message::Message};

use super::Context;
use crate::{impl_method, utils::rpc_config::serialize_and_encode, ClientResponse};

#[skip_serializing_none]
#[derive(Debug, Serialize_tuple)]
pub struct GetFeeForMessageRequest {
    #[serde(serialize_with = "ser_message")]
    pub message: Message,
    pub config: Option<CommitmentConfig>,
}

impl_method!(GetFeeForMessageRequest, "getFeeForMessage");

impl GetFeeForMessageRequest {
    pub fn new(message: Message) -> Self {
        Self {
            message,
            config: None,
        }
    }
    pub fn new_with_config(message: Message, config: CommitmentConfig) -> Self {
        Self {
            message,
            config: Some(config),
        }
    }
}

fn ser_message<S: Serializer>(msg: &Message, ser: S) -> Result<S::Ok, S::Error> {
    let message = serialize_and_encode::<Message>(msg, UiTransactionEncoding::Base64)
        .map_err(serde::ser::Error::custom)?;
    ser.serialize_str(&message)
}

#[derive(Debug, Deserialize)]
pub struct FeeForMessageValue(Option<u64>);

#[derive(Debug, Deserialize)]
pub struct GetFeeForMessageResponse {
    pub context: Context,
    pub value: FeeForMessageValue,
}

impl From<GetFeeForMessageResponse> for u64 {
    fn from(val: GetFeeForMessageResponse) -> Self {
        val.value.0.unwrap_or_default()
    }
}

#[cfg(test)]
mod tests {
    use serde_json::Value;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let decoded = base64::decode("AQABAgIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQAA").unwrap();
        let message = bincode::deserialize(&decoded).unwrap();
        let request = ClientRequest::new(GetFeeForMessageRequest::NAME)
            .id(1)
            .params(GetFeeForMessageRequest::new_with_config(
                message,
                CommitmentConfig::processed(),
            ));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"id":1,"jsonrpc":"2.0","method":"getFeeForMessage","params":["AQABAgIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQAA",{"commitment":"processed"}]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json =
            r#"{"jsonrpc":"2.0","result":{"context":{"slot":5068},"value":5000},"id":1}"#;

        let response: ClientResponse<GetFeeForMessageResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");

        assert_eq!(response.result.context.slot, 5068);
        assert_eq!(response.result.value.0, Some(5000));
    }
}
