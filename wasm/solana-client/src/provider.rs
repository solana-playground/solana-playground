use serde::de::DeserializeOwned;

use crate::{methods::Method, ClientError, ClientRequest, ClientResponse, ClientResult};

#[derive(Clone)]
pub struct HttpProvider {
    client: reqwest::Client,
    url: String,
}

impl HttpProvider {
    pub fn new(url: &str) -> Self {
        Self {
            client: reqwest::Client::new(),
            url: url.to_owned(),
        }
    }
}

impl HttpProvider {
    pub async fn send<T: Method, R: DeserializeOwned>(
        &self,
        request: &T,
    ) -> ClientResult<ClientResponse<R>> {
        let client = &self.client;
        let client_request = ClientRequest::new(T::NAME).id(0).params(request);

        let request_result: serde_json::Value = client
            .post(&self.url)
            .json(&client_request)
            .send()
            .await
            .map_err(ClientError::from)?
            .json()
            .await
            .map_err(ClientError::from)?;

        match serde_json::from_value::<ClientResponse<R>>(request_result.clone()) {
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
    pub fn new(url: &str) -> Self {
        Self::Http(HttpProvider::new(url))
    }
}
