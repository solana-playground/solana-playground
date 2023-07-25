use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GetHealthRequest {}

impl GetHealthRequest {
    pub fn new() -> Self {
        Self::default()
    }
}

impl From<GetHealthRequest> for serde_json::Value {
    fn from(_val: GetHealthRequest) -> Self {
        serde_json::Value::Null
    }
}

impl From<GetHealthRequest> for ClientRequest {
    fn from(val: GetHealthRequest) -> Self {
        let mut request = ClientRequest::new("getHealth");
        let params = val.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorValue {
    pub code: i32,
    pub message: String,
    pub data: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetHealthResponse(String);

impl From<ClientResponse> for GetHealthResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}
