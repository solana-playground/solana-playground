use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClientResponse {
    pub id: u32,
    pub jsonrpc: String,
    pub result: Value,
}
