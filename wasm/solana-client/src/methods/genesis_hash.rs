use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetGenesisHashRequest {}

impl GetGenesisHashRequest {
    pub fn new() -> Self {
        Self {}
    }
}

impl Into<serde_json::Value> for GetGenesisHashRequest {
    fn into(self) -> serde_json::Value {
        serde_json::Value::Null
    }
}

impl Into<ClientRequest> for GetGenesisHashRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getGenesisHash");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetGenesisHashResponse(String);

impl From<ClientResponse> for GetGenesisHashResponse {
    fn from(response: ClientResponse) -> Self {
        serde_json::from_value(response.result).unwrap()
    }
}

impl Into<String> for GetGenesisHashResponse {
    fn into(self) -> String {
        self.0
    }
}
