use super::Context;
use crate::{
    utils::{rpc_config::RpcSupplyConfig, rpc_response::RpcSupply},
    ClientRequest, ClientResponse,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetSupplyRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    config: Option<RpcSupplyConfig>,
}

impl GetSupplyRequest {
    pub fn new() -> Self {
        Self { config: None }
    }

    pub fn new_with_config(config: RpcSupplyConfig) -> Self {
        Self {
            config: Some(config),
        }
    }
}

impl Into<serde_json::Value> for GetSupplyRequest {
    fn into(self) -> serde_json::Value {
        match self.config {
            Some(config) => serde_json::json!([config]),
            None => serde_json::Value::Null,
        }
    }
}

impl Into<ClientRequest> for GetSupplyRequest {
    fn into(self) -> ClientRequest {
        let mut request = ClientRequest::new("getSupply");
        let params = self.into();

        request.params(params).clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetSupplyResponse {
    pub context: Context,
    pub value: RpcSupply,
}

impl From<ClientResponse> for GetSupplyResponse {
    fn from(response: ClientResponse) -> Self {
        let context = response.result["context"].clone();
        let value = response.result["value"].clone();
        let total = value["total"].as_u64().expect("total is a u64");
        let circulating = value["circulating"].as_u64().expect("circulating is a u64");
        let non_circulating = value["nonCirculating"]
            .as_u64()
            .expect("non_circulating is a u64");
        let non_circulating_accounts = value["nonCirculatingAccounts"]
            .as_array()
            .unwrap()
            .iter()
            .map(|account| account.to_string())
            .collect::<Vec<String>>();

        let value = serde_json::json!({
            "context": context,
            "value": RpcSupply {
                total,
                circulating,
                non_circulating,
                non_circulating_accounts,
            },
        });
        serde_json::from_value(value).unwrap()
    }
}
