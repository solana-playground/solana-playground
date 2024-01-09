use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GetGenesisHashRequest {}

impl GetGenesisHashRequest {
    pub fn new() -> Self {
        Self::default()
    }
}

impl From<GetGenesisHashRequest> for serde_json::Value {
    fn from(_val: GetGenesisHashRequest) -> Self {
        serde_json::Value::Null
    }
}

impl From<GetGenesisHashRequest> for ClientRequest {
    fn from(val: GetGenesisHashRequest) -> Self {
        let mut request = ClientRequest::new("getGenesisHash");
        let params = val.into();

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

impl From<GetGenesisHashResponse> for String {
    fn from(val: GetGenesisHashResponse) -> Self {
        val.0
    }
}
