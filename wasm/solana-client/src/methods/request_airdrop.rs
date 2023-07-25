use std::str::FromStr;

use solana_sdk::{
    commitment_config::CommitmentConfig,
    {pubkey::Pubkey, signature::Signature},
};

use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequestAirdropRequest {
    pub pubkey: Pubkey,
    pub lamports: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<CommitmentConfig>,
}

impl RequestAirdropRequest {
    pub fn new(pubkey: Pubkey, lamports: u64) -> Self {
        Self {
            pubkey,
            lamports,
            config: None,
        }
    }
    pub fn new_with_config(pubkey: Pubkey, lamports: u64, config: CommitmentConfig) -> Self {
        Self {
            pubkey,
            lamports,
            config: Some(config),
        }
    }
}

impl From<RequestAirdropRequest> for serde_json::Value {
    fn from(value: RequestAirdropRequest) -> Self {
        let pubkey = value.pubkey.to_string();

        match value.config {
            Some(config) => serde_json::json!([pubkey, value.lamports, config]),
            None => serde_json::json!([pubkey, value.lamports]),
        }
    }
}

impl From<RequestAirdropRequest> for ClientRequest {
    fn from(val: RequestAirdropRequest) -> Self {
        let mut request = ClientRequest::new("requestAirdrop");
        let params = val.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequestAirdropResponse(Signature);

impl From<RequestAirdropResponse> for Signature {
    fn from(val: RequestAirdropResponse) -> Self {
        val.0
    }
}

impl From<ClientResponse> for RequestAirdropResponse {
    fn from(response: ClientResponse) -> Self {
        let signature = response.result.as_str().expect("invalid response");
        let signature = Signature::from_str(signature).expect("invalid signature");

        RequestAirdropResponse(signature)
    }
}
