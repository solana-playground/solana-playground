use std::str::FromStr;

use solana_sdk::{signature::Signature, transaction::Transaction};

use crate::{utils::rpc_config::RpcSimulateTransactionConfig, ClientRequest, ClientResponse};

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
            config: None,
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
        let encoded_transaction = bs58::encode(&transaction_data).into_string();

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
