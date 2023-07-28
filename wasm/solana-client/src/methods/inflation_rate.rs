use crate::{utils::rpc_response::RpcInflationRate, ClientRequest, ClientResponse};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GetInflationRateRequest {}

impl GetInflationRateRequest {
    pub fn new() -> Self {
        Self::default()
    }
}

impl From<GetInflationRateRequest> for serde_json::Value {
    fn from(_val: GetInflationRateRequest) -> Self {
        serde_json::Value::Null
    }
}

impl From<GetInflationRateRequest> for ClientRequest {
    fn from(val: GetInflationRateRequest) -> Self {
        let mut request = ClientRequest::new("getInflationRate");
        let params = val.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetInflationRateResponse(RpcInflationRate);

impl From<ClientResponse> for GetInflationRateResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl From<GetInflationRateResponse> for RpcInflationRate {
    fn from(value: GetInflationRateResponse) -> Self {
        value.0
    }
}
