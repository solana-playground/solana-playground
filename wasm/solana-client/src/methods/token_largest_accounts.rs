use solana_sdk::{commitment_config::CommitmentConfig, pubkey::Pubkey};

use super::{serde_utils::deserialize_public_key, Context};
use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetTokenLargestAccountsRequest {
    pub pubkey: Pubkey,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<CommitmentConfig>,
}

impl GetTokenLargestAccountsRequest {
    pub fn new(pubkey: Pubkey) -> Self {
        Self {
            pubkey,
            config: None,
        }
    }
    pub fn new_with_config(pubkey: Pubkey, config: CommitmentConfig) -> Self {
        Self {
            pubkey,
            config: Some(config),
        }
    }
}

impl Into<serde_json::Value> for GetTokenLargestAccountsRequest {
    fn into(self) -> serde_json::Value {
        let pubkey = self.pubkey.to_string();

        match self.config {
            Some(config) => serde_json::json!([pubkey, config]),
            None => serde_json::json!([pubkey]),
        }
    }
}

impl Into<ClientRequest> for GetTokenLargestAccountsRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getTokenLargestAccounts");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenLargestAccountsValue {
    #[serde(deserialize_with = "deserialize_public_key")]
    pub address: Pubkey,
    pub amount: String,
    pub decimals: u8,
    pub ui_amount: Option<u64>,
    pub ui_amount_string: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetTokenLargestAccountsResponse {
    pub context: Context,
    pub value: Vec<TokenLargestAccountsValue>,
}

impl From<ClientResponse> for GetTokenLargestAccountsResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}
