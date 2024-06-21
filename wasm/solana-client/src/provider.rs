use std::time::Duration;

use crate::{ClientError, ClientRequest, ClientResponse, ClientResult};

#[derive(Clone)]
pub struct HttpProvider {
    client: reqwest::Client,
    headers: reqwest::header::HeaderMap,
    url: String,
    timeout: Duration,
}

impl HttpProvider {
    pub fn new(url: &str, timeout: Duration) -> Self {
        Self {
            client: reqwest::Client::new(),
            headers: reqwest::header::HeaderMap::new(),
            url: url.to_owned(),
            timeout,
        }
    }
}

impl HttpProvider {
    pub async fn send(&self, request: &ClientRequest) -> ClientResult<ClientResponse> {
        let client = &self.client;
        let url = self.url.clone();
        let headers = self.headers.clone();

        let request_result: serde_json::Value = client
            .post(&url)
            .headers(headers)
            .json(&request)
            .timeout(self.timeout)
            .send()
            .await
            .map_err(ClientError::from)?
            .json()
            .await
            .map_err(ClientError::from)?;

        match serde_json::from_value::<ClientResponse>(request_result.clone()) {
            Ok(response) => Ok(response),
            Err(_) => Err(serde_json::from_value::<ClientError>(request_result).unwrap()),
        }
    }
}

#[derive(Clone)]
pub enum Provider {
    Http(HttpProvider),
}

impl Provider {
    pub fn new(url: &str, timeout: Duration) -> Self {
        Self::Http(HttpProvider::new(url, timeout))
    }
}
