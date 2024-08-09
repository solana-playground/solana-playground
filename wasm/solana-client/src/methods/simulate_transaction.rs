use serde::{ser::SerializeTuple, Serialize};
use solana_extra_wasm::{account_decoder::UiAccount, transaction_status::UiTransactionEncoding};
use solana_sdk::transaction::{Transaction, TransactionError};

use crate::{
    impl_method,
    utils::rpc_config::{serialize_and_encode, RpcSimulateTransactionConfig},
    ClientRequest, ClientResponse,
};

use super::Context;

#[derive(Debug)]
pub struct SimulateTransactionRequest {
    pub transaction: Transaction,
    pub config: Option<RpcSimulateTransactionConfig>,
}

impl_method!(SimulateTransactionRequest, "simulateTransaction");

impl SimulateTransactionRequest {
    pub fn new(transaction: Transaction) -> Self {
        Self {
            transaction,
            config: Some(RpcSimulateTransactionConfig {
                encoding: Some(UiTransactionEncoding::Base64),
                replace_recent_blockhash: Some(true),
                ..Default::default()
            }),
        }
    }
    pub fn new_with_config(transaction: Transaction, config: RpcSimulateTransactionConfig) -> Self {
        Self {
            transaction,
            config: Some(config),
        }
    }
}

impl Serialize for SimulateTransactionRequest {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let encoding = match self.config {
            Some(ref c) => c.encoding.unwrap_or(UiTransactionEncoding::Base58),
            None => UiTransactionEncoding::Base58,
        };

        let serialized_encoded =
            serialize_and_encode::<Transaction>(&self.transaction, encoding).unwrap();

        let tuple = match &self.config {
            Some(config) => {
                let mut tuple = serializer.serialize_tuple(2)?;
                tuple.serialize_element(&serialized_encoded)?;
                tuple.serialize_element(&config)?;
                tuple
            }
            None => {
                let mut tuple = serializer.serialize_tuple(1)?;
                tuple.serialize_element(&serialized_encoded)?;
                tuple
            }
        };

        tuple.end()
    }
}

#[derive(Deserialize, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SimulateTransactionResponseValue {
    pub err: Option<TransactionError>,
    pub logs: Option<Vec<String>>,
    pub accounts: Option<Vec<Option<UiAccount>>>,
    pub units_consumed: Option<u64>,
    pub return_data: Option<UiTransactionReturnData>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct UiTransactionReturnData {
    pub program_id: String,
    pub data: (String, UiReturnDataEncoding),
}

#[derive(Serialize, Deserialize, Clone, Copy, Debug, Eq, Hash, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum UiReturnDataEncoding {
    Base64,
}

#[derive(Debug, Deserialize)]
pub struct SimulateTransactionResponse {
    pub context: Context,
    pub value: SimulateTransactionResponseValue,
}

#[cfg(test)]
mod tests {
    use serde_json::Value;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let tx = bincode::deserialize(&base64::decode("AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDArczbMia1tLmq7zz4DinMNN0pJ1JtLdqIJPUw3YrGCzYAMHBsgN27lcgB6H2WQvFgyZuJYHa46puOQo9yQ8CVQbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCp20C7Wj2aiuk5TReAXo+VTVg8QTHjs0UjNMMKCvpzZ+ABAgEBARU=").unwrap()).unwrap();
        let request = ClientRequest::new(SimulateTransactionRequest::NAME)
            .id(1)
            .params(SimulateTransactionRequest::new_with_config(
                tx,
                RpcSimulateTransactionConfig {
                    encoding: Some(UiTransactionEncoding::Base64),
                    ..Default::default()
                },
            ));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"simulateTransaction","params":["AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDArczbMia1tLmq7zz4DinMNN0pJ1JtLdqIJPUw3YrGCzYAMHBsgN27lcgB6H2WQvFgyZuJYHa46puOQo9yQ8CVQbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCp20C7Wj2aiuk5TReAXo+VTVg8QTHjs0UjNMMKCvpzZ+ABAgEBARU=",{"encoding":"base64"}]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":{"context":{"slot":218},"value":{"err":null,"accounts":null,"logs":["Program 83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri invoke [1]","Program 83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri consumed 2366 of 1400000 compute units","Program return: 83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri KgAAAAAAAAA=","Program 83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri success"],"returnData":{"data":["Kg==","base64"],"programId":"83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri"},"unitsConsumed":2366}},"id":1}"#;

        let response: ClientResponse<SimulateTransactionResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(response.result.context.slot, 218);
        assert_eq!(response.result.value, SimulateTransactionResponseValue {
            accounts: None,
            err: None,
            logs: Some(vec!["Program 83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri invoke [1]".to_string(), "Program 83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri consumed 2366 of 1400000 compute units".to_string(), "Program return: 83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri KgAAAAAAAAA=".to_string(), "Program 83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri success".to_string()]),
            return_data: Some(UiTransactionReturnData {
                program_id: "83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri".to_string(),
                data: ("Kg==".to_string(), UiReturnDataEncoding::Base64)
            }),
            units_consumed: Some(2366)
        });
    }
}
