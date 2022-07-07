use crate::{utils::rpc_response::RpcVersionInfo, ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetVersionRequest {}

impl GetVersionRequest {
    pub fn new() -> Self {
        Self {}
    }
}

impl Into<serde_json::Value> for GetVersionRequest {
    fn into(self) -> serde_json::Value {
        serde_json::Value::Null
    }
}

impl Into<ClientRequest> for GetVersionRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getVersion");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetVersionResponse(RpcVersionInfo);

impl From<ClientResponse> for GetVersionResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl Into<RpcVersionInfo> for GetVersionResponse {
    fn into(self) -> RpcVersionInfo {
        self.0
    }
}
