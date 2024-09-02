use serde::Serialize;
use serde_json::Value;
use serde_with::serde_as;

#[serde_as]
#[derive(Debug, Serialize)]
pub struct ClientRequest {
    id: u32,
    jsonrpc: &'static str,
    method: String,
    #[serde(skip_serializing_if = "is_null")]
    params: Value,
}

impl ClientRequest {
    pub fn new(method: impl ToString) -> Self {
        Self {
            id: 0,
            jsonrpc: "2.0",
            method: method.to_string(),
            params: Value::Null,
        }
    }
    pub fn id(mut self, id: u32) -> Self {
        self.id = id;
        self
    }

    pub fn jsonrpc(mut self, jsonrpc: &'static str) -> Self {
        self.jsonrpc = jsonrpc;
        self
    }

    pub fn params<T: Serialize>(mut self, params: T) -> Self {
        self.params = serde_json::to_value(params).unwrap_or_default();
        self
    }
}

fn is_null(v: &Value) -> bool {
    match v {
        Value::Null => true,
        Value::Array(a) => a.iter().all(|el| el.is_null()),
        _ => false,
    }
}
