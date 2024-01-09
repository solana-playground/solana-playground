use serde::Deserialize;
use solana_extra_wasm::program::vote::vote_state::MAX_LOCKOUT_HISTORY;

use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetBlockCommitmentRequest {
    pub slot: u64,
}

impl GetBlockCommitmentRequest {
    pub fn new(slot: u64) -> Self {
        Self { slot }
    }
}

impl From<GetBlockCommitmentRequest> for serde_json::Value {
    fn from(value: GetBlockCommitmentRequest) -> Self {
        serde_json::json!([value.slot])
    }
}

impl From<GetBlockCommitmentRequest> for ClientRequest {
    fn from(value: GetBlockCommitmentRequest) -> Self {
        let mut request = ClientRequest::new("getBlockCommitment");
        let params = value.into();

        request.params(params).clone()
    }
}

type BlockCommitmentArray = [u64; MAX_LOCKOUT_HISTORY + 1];

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetBlockCommitmentResponse {
    pub commitment: Option<BlockCommitmentArray>,
    pub total_stake: u64,
}

impl From<ClientResponse> for GetBlockCommitmentResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}
