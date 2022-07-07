use crate::{utils::rpc_response::RpcInflationRate, ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetInflationRateRequest {}

impl GetInflationRateRequest {
    pub fn new() -> Self {
        Self {}
    }
}

impl Into<serde_json::Value> for GetInflationRateRequest {
    fn into(self) -> serde_json::Value {
        serde_json::Value::Null
    }
}

impl Into<ClientRequest> for GetInflationRateRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getInflationRate");
        let params = self.into();

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

impl Into<RpcInflationRate> for GetInflationRateResponse {
    fn into(self) -> RpcInflationRate {
        self.0
    }
}
