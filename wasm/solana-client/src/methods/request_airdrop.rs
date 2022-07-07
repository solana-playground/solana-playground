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

impl Into<serde_json::Value> for RequestAirdropRequest {
    fn into(self) -> serde_json::Value {
        let pubkey = self.pubkey.to_string();

        match self.config {
            Some(config) => serde_json::json!([pubkey, self.lamports, config]),
            None => serde_json::json!([pubkey, self.lamports]),
        }
    }
}

impl Into<ClientRequest> for RequestAirdropRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("requestAirdrop");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequestAirdropResponse(Signature);

impl Into<Signature> for RequestAirdropResponse {
    fn into(self) -> Signature {
        self.0
    }
}

impl From<ClientResponse> for RequestAirdropResponse {
    fn from(response: ClientResponse) -> Self {
        let signature = response.result.as_str().expect("invalid response");
        let signature = Signature::from_str(signature).expect("invalid signature");

        RequestAirdropResponse(signature)
    }
}
