use serde_with::{serde_as, DisplayFromStr};
use solana_sdk::pubkey::Pubkey;

use crate::{impl_method, ClientRequest, ClientResponse};

#[derive(Debug, Serialize)]
pub struct GetIdentityRequest;

impl_method!(GetIdentityRequest, "getIdentity");

#[serde_as]
#[derive(Debug, Deserialize)]
pub struct GetIdentityResponse {
    #[serde_as(as = "DisplayFromStr")]
    pub identity: Pubkey,
}

#[cfg(test)]
mod tests {
    use serde_json::Value;
    use solana_sdk::pubkey;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetIdentityRequest::NAME)
            .id(1)
            .params(GetIdentityRequest);

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1, "method":"getIdentity"}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":{"identity":"2r1F4iWqVcb8M1DbAjQuFpebkQHY9hcVU4WuW2DJBppN"},"id":1}"#;

        let response: ClientResponse<GetIdentityResponse> = serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(
            response.result.identity,
            pubkey!("2r1F4iWqVcb8M1DbAjQuFpebkQHY9hcVU4WuW2DJBppN")
        );
    }
}
