use solana_extra_wasm::transaction_status::UiTransactionEncoding;
use solana_sdk::pubkey::Pubkey;

use super::Context;
use crate::{
    utils::rpc_config::{RpcAccountInfoConfig, RpcKeyedAccount},
    ClientRequest, ClientResponse,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AccountType {
    MintAccount,
    ProgramAccount,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetTokenAccountsByDelegateRequest {
    pub pubkey: Pubkey,
    pub account_type: AccountType,
    pub account_key: Pubkey,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<RpcAccountInfoConfig>,
}

impl GetTokenAccountsByDelegateRequest {
    pub fn new_mint(pubkey: Pubkey, account_key: Pubkey) -> Self {
        Self {
            pubkey,
            account_key,
            account_type: AccountType::MintAccount,
            config: None,
        }
    }

    pub fn new_mint_with_config(
        pubkey: Pubkey,
        account_key: Pubkey,
        config: RpcAccountInfoConfig,
    ) -> Self {
        Self {
            pubkey,
            account_key,
            account_type: AccountType::MintAccount,
            config: Some(config),
        }
    }

    pub fn new_program(pubkey: Pubkey, account_key: Pubkey) -> Self {
        Self {
            pubkey,
            account_key,
            account_type: AccountType::ProgramAccount,
            config: None,
        }
    }

    pub fn new_program_with_config(
        pubkey: Pubkey,
        account_key: Pubkey,
        config: RpcAccountInfoConfig,
    ) -> Self {
        Self {
            pubkey,
            account_key,
            account_type: AccountType::ProgramAccount,
            config: Some(config),
        }
    }
}

impl From<GetTokenAccountsByDelegateRequest> for serde_json::Value {
    fn from(value: GetTokenAccountsByDelegateRequest) -> Self {
        let pubkey = value.pubkey.to_string();
        let account_key = match value.account_type {
            AccountType::MintAccount => {
                serde_json::json!({"mint": value.account_key.to_string()})
            }
            AccountType::ProgramAccount => {
                serde_json::json!({"programId": value.account_key.to_string()})
            }
        };

        match value.config {
            Some(config) => serde_json::json!([pubkey, account_key, config]),
            None => {
                let config = serde_json::json!({ "encoding": UiTransactionEncoding::JsonParsed });
                serde_json::json!([pubkey, account_key, config])
            }
        }
    }
}

impl From<GetTokenAccountsByDelegateRequest> for ClientRequest {
    fn from(value: GetTokenAccountsByDelegateRequest) -> Self {
        let mut request = ClientRequest::new("getTokenAccountsByDelegate");
        let params = value.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetTokenAccountsByDelegateResponse {
    pub context: Context,
    pub value: Option<Vec<RpcKeyedAccount>>,
}

impl From<ClientResponse> for GetTokenAccountsByDelegateResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}
