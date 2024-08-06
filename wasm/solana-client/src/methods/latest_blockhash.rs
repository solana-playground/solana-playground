use serde_tuple::Serialize_tuple;
use serde_with::skip_serializing_none;
use solana_sdk::commitment_config::CommitmentConfig;

use super::Context;
use crate::{impl_method, utils::rpc_response::RpcBlockhash, ClientRequest, ClientResponse};

#[skip_serializing_none]
#[derive(Debug, Default, Serialize_tuple)]
pub struct GetLatestBlockhashRequest {
    pub config: Option<CommitmentConfig>,
}

impl_method!(GetLatestBlockhashRequest, "getLatestBlockhash");

impl GetLatestBlockhashRequest {
    pub fn new() -> Self {
        Self::default()
    }
    pub fn new_with_config(config: CommitmentConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetLatestBlockhashResponse {
    pub context: Context,
    pub value: RpcBlockhash,
}

#[cfg(test)]
mod tests {
    use serde_json::Value;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetLatestBlockhashRequest::NAME)
            .id(1)
            .params(GetLatestBlockhashRequest::new_with_config(
                CommitmentConfig::processed(),
            ));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"id":1,"jsonrpc":"2.0","method":"getLatestBlockhash","params":[{"commitment":"processed"}]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":{"context":{"slot":2792},"value":{"blockhash":"EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N","lastValidBlockHeight":3090}},"id":1}"#;

        let response: ClientResponse<GetLatestBlockhashResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(response.result.context.slot, 2792);
        let value = response.result.value;
        assert_eq!(
            value.blockhash,
            "EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N"
        );
        assert_eq!(value.last_valid_block_height, 3090);
    }
}
