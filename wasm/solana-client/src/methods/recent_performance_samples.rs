use crate::{utils::rpc_response::RpcPerfSample, ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetRecentPerformanceSamplesRequestConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub limit: Option<usize>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GetRecentPerformanceSamplesRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<GetRecentPerformanceSamplesRequestConfig>,
}

impl GetRecentPerformanceSamplesRequest {
    pub fn new() -> Self {
        Self::default()
    }
    pub fn new_with_config(config: GetRecentPerformanceSamplesRequestConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

impl From<GetRecentPerformanceSamplesRequest> for serde_json::Value {
    fn from(value: GetRecentPerformanceSamplesRequest) -> Self {
        match value.config {
            Some(config) => serde_json::json!([config.limit]),
            None => serde_json::Value::Null,
        }
    }
}

impl From<GetRecentPerformanceSamplesRequest> for ClientRequest {
    fn from(val: GetRecentPerformanceSamplesRequest) -> Self {
        let mut request = ClientRequest::new("getRecentPerformanceSamples");
        let params = val.into();

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

impl From<GetRecentPerformanceSamplesResponse> for Vec<RpcPerfSample> {
    fn from(val: GetRecentPerformanceSamplesResponse) -> Self {
        val.0
    }
}
