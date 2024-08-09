use std::str::FromStr;

use serde::ser::SerializeTuple;
use serde::Serialize;
use serde_with::{serde_as, skip_serializing_none, DisplayFromStr};
use solana_extra_wasm::transaction_status::UiTransactionEncoding;
use solana_sdk::{signature::Signature, transaction::Transaction};

use crate::utils::rpc_config::{serialize_and_encode, RpcSendTransactionConfig};
use crate::{impl_method, ClientRequest, ClientResponse};

#[derive(Debug)]
pub struct SendTransactionRequest {
    transaction: Transaction,
    config: Option<RpcSendTransactionConfig>,
}

impl_method!(SendTransactionRequest, "sendTransaction");

impl SendTransactionRequest {
    pub fn new(transaction: Transaction) -> Self {
        Self {
            transaction,
            config: None,
        }
    }
    pub fn new_with_config(transaction: Transaction, config: RpcSendTransactionConfig) -> Self {
        Self {
            transaction,
            config: Some(config),
        }
    }
}

impl Serialize for SendTransactionRequest {
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

        let tuple = match self.config {
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

#[serde_as]
#[derive(Debug, Deserialize)]
pub struct SendTransactionResponse(#[serde_as(as = "DisplayFromStr")] Signature);

impl From<SendTransactionResponse> for Signature {
    fn from(val: SendTransactionResponse) -> Self {
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
        let tx = bincode::deserialize(&bs58::decode("4hXTCkRzt9WyecNzV1XPgCDfGAZzQKNxLXgynz5QDuWWPSAZBZSHptvWRL3BjCvzUXRdKvHL2b7yGrRQcWyaqsaBCncVG7BFggS8w9snUts67BSh3EqKpXLUm5UMHfD7ZBe9GhARjbNQMLJ1QD3Spr6oMTBU6EhdB4RD8CP2xUxr2u3d6fos36PD98XS6oX8TQjLpsMwncs5DAMiD4nNnR8NBfyghGCWvCVifVwvA8B8TJxE1aiyiv2L429BCWfyzAme5sZW8rDb14NeCQHhZbtNqfXhcp2tAnaAT").into_vec().unwrap()).unwrap();
        let request = ClientRequest::new(SendTransactionRequest::NAME)
            .id(1)
            .params(SendTransactionRequest::new(tx));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"sendTransaction","params":["4hXTCkRzt9WyecNzV1XPgCDfGAZzQKNxLXgynz5QDuWWPSAZBZSHptvWRL3BjCvzUXRdKvHL2b7yGrRQcWyaqsaBCncVG7BFggS8w9snUts67BSh3EqKpXLUm5UMHfD7ZBe9GhARjbNQMLJ1QD3Spr6oMTBU6EhdB4RD8CP2xUxr2u3d6fos36PD98XS6oX8TQjLpsMwncs5DAMiD4nNnR8NBfyghGCWvCVifVwvA8B8TJxE1aiyiv2L429BCWfyzAme5sZW8rDb14NeCQHhZbtNqfXhcp2tAnaAT"]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":"2id3YC2jK9G5Wo2phDx4gJVAew8DcY5NAojnVuao8rkxwPYPe8cSwE5GzhEgJA2y8fVjDEo6iR6ykBvDxrTQrtpb","id":1}"#;

        let response: ClientResponse<SendTransactionResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(response.result.0, Signature::from_str("2id3YC2jK9G5Wo2phDx4gJVAew8DcY5NAojnVuao8rkxwPYPe8cSwE5GzhEgJA2y8fVjDEo6iR6ykBvDxrTQrtpb").unwrap());
    }
}
