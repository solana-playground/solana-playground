use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClientRequest {
    id: u32,
    jsonrpc: String,
    method: String,
    params: Option<Value>,
}

impl ClientRequest {
    pub fn new(method: &str) -> Self {
        Self {
            id: 0,
            jsonrpc: "2.0".to_owned(),
            method: method.to_owned(),
            params: None,
        }
    }
    pub fn id<'a>(&'a mut self, id: u32) -> &'a mut ClientRequest {
        self.id = id;
        self
    }

    pub fn jsonrpc<'a>(&'a mut self, jsonrpc: &str) -> &'a mut ClientRequest {
        self.jsonrpc = jsonrpc.to_owned();
        self
    }

    pub fn params<'a>(&'a mut self, params: Value) -> &'a mut ClientRequest {
        self.params = Some(params);
        self
    }
}
