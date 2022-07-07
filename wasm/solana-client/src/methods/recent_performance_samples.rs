use crate::{utils::rpc_response::RpcPerfSample, ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetRecentPerformanceSamplesRequestConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub limit: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetRecentPerformanceSamplesRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<GetRecentPerformanceSamplesRequestConfig>,
}

impl GetRecentPerformanceSamplesRequest {
    pub fn new() -> Self {
        Self { config: None }
    }
    pub fn new_with_config(config: GetRecentPerformanceSamplesRequestConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

impl Into<serde_json::Value> for GetRecentPerformanceSamplesRequest {
    fn into(self) -> serde_json::Value {
        match self.config {
            Some(config) => serde_json::json!([config.limit]),
            None => serde_json::Value::Null,
        }
    }
}

impl Into<ClientRequest> for GetRecentPerformanceSamplesRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getRecentPerformanceSamples");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetRecentPerformanceSamplesResponse(Vec<RpcPerfSample>);

impl From<ClientResponse> for GetRecentPerformanceSamplesResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl Into<Vec<RpcPerfSample>> for GetRecentPerformanceSamplesResponse {
    fn into(self) -> Vec<RpcPerfSample> {
        self.0
    }
}
