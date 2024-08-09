use crate::{impl_method, utils::rpc_response::RpcInflationRate, ClientRequest, ClientResponse};

#[derive(Debug, Serialize)]
pub struct GetInflationRateRequest;

impl_method!(GetInflationRateRequest, "getInflationRate");

#[derive(Debug, Deserialize)]
pub struct GetInflationRateResponse(RpcInflationRate);

impl From<GetInflationRateResponse> for RpcInflationRate {
    fn from(value: GetInflationRateResponse) -> Self {
        value.0
    }
}

#[cfg(test)]
mod tests {
    use serde_json::Value;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetInflationRateRequest::NAME)
            .id(1)
            .params(GetInflationRateRequest);

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1, "method":"getInflationRate"}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":{"epoch":100,"foundation":0.001,"total":0.149,"validator":0.148},"id":1}"#;

        let response: ClientResponse<GetInflationRateResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        let value = response.result.0;
        assert_eq!(value.foundation, 0.001);
        assert_eq!(value.epoch, 100);
        assert_eq!(value.total, 0.149);
        assert_eq!(value.validator, 0.148);
    }
}
