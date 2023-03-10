use crate::{utils::rpc_config::RpcSimulateTransactionConfig, ClientRequest, ClientResponse};
use solana_extra_wasm::{account_decoder::UiAccount, transaction_status::UiTransactionEncoding};
use solana_sdk::{
    signature::Signature,
    transaction::{Transaction, TransactionError},
};
use std::str::FromStr;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulateTransactionRequest {
    pub transaction: Transaction,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<RpcSimulateTransactionConfig>,
}

impl SimulateTransactionRequest {
    pub fn new(transaction: Transaction) -> Self {
        Self {
            transaction,
            config: Some(RpcSimulateTransactionConfig {
                encoding: Some(UiTransactionEncoding::Base64),
                replace_recent_blockhash: true,
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

impl Into<serde_json::Value> for SimulateTransactionRequest {
    fn into(self) -> serde_json::Value {
        let transaction_data = bincode::serialize(&self.transaction).unwrap();
        let encoded_transaction = base64::encode(&transaction_data);

        match self.config {
            Some(config) => serde_json::json!([encoded_transaction, config]),
            None => serde_json::json!([encoded_transaction]),
        }
    }
}

impl Into<ClientRequest> for SimulateTransactionRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("simulateTransaction");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulateTransactionResponse(Signature);

impl Into<Signature> for SimulateTransactionResponse {
    fn into(self) -> Signature {
        self.0
    }
}

impl From<ClientResponse> for SimulateTransactionResponse {
    fn from(response: ClientResponse) -> Self {
        let signature = response.result.as_str().expect("invalid response");
        let signature = Signature::from_str(signature).expect("invalid signature");

        SimulateTransactionResponse(signature)
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SimulateTransactionResult {
    pub err: Option<TransactionError>,
    pub logs: Option<Vec<String>>,
    pub accounts: Option<Vec<Option<UiAccount>>>,
    pub units_consumed: Option<u64>,
    pub return_data: Option<UiTransactionReturnData>,
}

impl From<ClientResponse> for SimulateTransactionResult {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result.get("value").unwrap().to_owned()).unwrap()
    }
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
