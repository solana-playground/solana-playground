use crate::{ClientRequest, ClientResponse};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GetClusterNodesRequest {}

impl GetClusterNodesRequest {
    pub fn new() -> Self {
        Self::default()
    }
}

impl From<GetClusterNodesRequest> for serde_json::Value {
    fn from(_: GetClusterNodesRequest) -> Self {
        serde_json::Value::Null
    }
}

impl From<GetClusterNodesRequest> for ClientRequest {
    fn from(value: GetClusterNodesRequest) -> Self {
        let mut request = ClientRequest::new("getClusterNodes");
        let params = value.into();

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

impl From<GetClusterNodesResponse> for Vec<RpcContactInfoWasm> {
    fn from(value: GetClusterNodesResponse) -> Self {
        value.0
    }
}
