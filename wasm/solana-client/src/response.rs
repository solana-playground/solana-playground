use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct ClientResponse<T> {
    pub id: u32,
    pub jsonrpc: String,
    pub result: T,
}
