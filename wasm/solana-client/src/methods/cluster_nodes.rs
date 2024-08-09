use serde_tuple::Serialize_tuple;

use crate::{impl_method, ClientRequest, ClientResponse};

#[derive(Debug, Serialize)]
pub struct GetClusterNodesRequest;

impl_method!(GetClusterNodesRequest, "getClusterNodes");

#[derive(Debug, Deserialize)]
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

#[derive(Debug, Deserialize)]
pub struct GetClusterNodesResponse(Vec<RpcContactInfoWasm>);

impl From<GetClusterNodesResponse> for Vec<RpcContactInfoWasm> {
    fn from(value: GetClusterNodesResponse) -> Self {
        value.0
    }
}

#[cfg(test)]
mod tests {
    use serde_json::Value;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetClusterNodesRequest::NAME)
            .id(1)
            .params(GetClusterNodesRequest);

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getClusterNodes"}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":[{"gossip":"10.239.6.48:8001","pubkey":"9QzsJf7LPLj8GkXbYT3LFDKqsj2hHG7TA3xinJHu8epQ","rpc":"10.239.6.48:8899","tpu":"10.239.6.48:8856","version":"1.0.0 c375ce1f"}],"id":1}"#;

        let response: ClientResponse<GetClusterNodesResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");

        let value = &response.result.0[0];

        assert_eq!(value.gossip.as_ref().unwrap(), "10.239.6.48:8001");
        assert_eq!(value.pubkey, "9QzsJf7LPLj8GkXbYT3LFDKqsj2hHG7TA3xinJHu8epQ");
        assert_eq!(value.rpc.as_ref().unwrap(), "10.239.6.48:8899");
        assert_eq!(value.tpu.as_ref().unwrap(), "10.239.6.48:8856");
        assert_eq!(value.version.as_ref().unwrap(), "1.0.0 c375ce1f");
        assert!(value.feature_set.is_none());
        assert!(value.shred_version.is_none());
    }
}
