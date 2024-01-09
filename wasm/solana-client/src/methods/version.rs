use crate::{utils::rpc_response::RpcVersionInfo, ClientRequest, ClientResponse};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GetVersionRequest {}

impl GetVersionRequest {
    pub fn new() -> Self {
        Self::default()
    }
}

impl From<GetVersionRequest> for serde_json::Value {
    fn from(_: GetVersionRequest) -> Self {
        serde_json::Value::Null
    }
}

impl From<GetVersionRequest> for ClientRequest {
    fn from(value: GetVersionRequest) -> Self {
        let mut request = ClientRequest::new("getVersion");
        let params = value.into();

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

impl From<GetVersionResponse> for RpcVersionInfo {
    fn from(value: GetVersionResponse) -> Self {
        value.0
    }
}
