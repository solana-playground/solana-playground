use solana_extra_wasm::account_decoder::parse_token::UiTokenAmount;
use solana_sdk::{commitment_config::CommitmentConfig, pubkey::Pubkey};

use super::Context;
use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetTokenAccountBalanceRequest {
    pub account: Pubkey,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<CommitmentConfig>,
}

impl GetTokenAccountBalanceRequest {
    pub fn new(account: Pubkey) -> Self {
        Self {
            account,
            config: None,
        }
    }

    pub fn new_with_config(account: Pubkey, config: CommitmentConfig) -> Self {
        Self {
            account,
            config: Some(config),
        }
    }
}

impl Into<serde_json::Value> for GetTokenAccountBalanceRequest {
    fn into(self) -> serde_json::Value {
        let account = self.account.to_string();

        match self.config {
            Some(config) => serde_json::json!([account, config]),
            None => serde_json::json!([account]),
        }
    }
}

impl Into<ClientRequest> for GetTokenAccountBalanceRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getTokenAccountBalance");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetTokenAccountBalanceResponse {
    pub context: Context,
    pub value: UiTokenAmount,
}

impl From<ClientResponse> for GetTokenAccountBalanceResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}
