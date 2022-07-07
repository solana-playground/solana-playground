use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetClusterNodesRequest {}

impl GetClusterNodesRequest {
    pub fn new() -> Self {
        Self {}
    }
}

impl Into<serde_json::Value> for GetClusterNodesRequest {
    fn into(self) -> serde_json::Value {
        serde_json::Value::Null
    }
}

impl Into<ClientRequest> for GetClusterNodesRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getClusterNodes");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RpcContactInfoWasm {
    pub pubkey: String,
    pub gossip: Option<String>,
    pub tpu: Option<String>,
    pub rpc: Option<String>,
    pub version: Option<String>,
    pub feature_set: Option<u32>,
    pub shred_version: Option<u16>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetClusterNodesResponse(Vec<RpcContactInfoWasm>);

impl From<ClientResponse> for GetClusterNodesResponse {
    fn from(response: ClientResponse) -> Self {
        let nodes = response
            .result
            .as_array()
            .unwrap()
            .iter()
            .map(|item| serde_json::from_value(item.clone()).unwrap())
            .collect::<Vec<RpcContactInfoWasm>>();

        GetClusterNodesResponse(nodes)
    }
}

impl Into<Vec<RpcContactInfoWasm>> for GetClusterNodesResponse {
    fn into(self) -> Vec<RpcContactInfoWasm> {
        self.0
    }
}
