use std::pin::pin;

use futures::future::{select, Either};
use gloo_net::http::{Method as HttpMethod, RequestBuilder};
use gloo_timers::future::TimeoutFuture;
use http::StatusCode;
use serde::de::DeserializeOwned;
use web_sys::{wasm_bindgen::UnwrapThrowExt, AbortController};

use crate::{methods::Method, ClientError, ClientRequest, ClientResponse, ClientResult};

#[derive(Clone)]
pub struct HttpProvider {
    url: String,
    timeout: u32,
}

impl HttpProvider {
    pub fn new(url: impl ToString) -> Self {
        Self {
            url: url.to_string(),
            timeout: 60000,
        }
    }

    pub fn new_with_timeout(url: impl ToString, timeout: u32) -> Self {
        Self {
            url: url.to_string(),
            timeout,
        }
    }
}

impl HttpProvider {
    pub async fn send<T: Method, R: DeserializeOwned>(
        &self,
        request: &T,
    ) -> ClientResult<ClientResponse<R>> {
        let client_request = ClientRequest::new(T::NAME).id(0).params(request);

        let ctrl = AbortController::new().unwrap_throw();
        let timeout_fut = TimeoutFuture::new(self.timeout);
        let req_fut = RequestBuilder::new(&self.url)
            .method(HttpMethod::POST)
            .abort_signal(Some(&ctrl.signal()))
            .json(&client_request)?
            .send();

        let fut = match select(timeout_fut, pin!(req_fut)).await {
            Either::Left((_, fut)) => {
                ctrl.abort();
                fut.await
            }
            Either::Right((val, fut)) => {
                drop(fut);
                val
            }
        };

        let response = fut?;
        let status =
            StatusCode::from_u16(response.status()).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);

        if status.is_success() {
            if let Ok(response) = response.json::<ClientResponse<R>>().await {
                return Ok(response);
            }
        }

        match response.json::<ClientError>().await {
            Ok(error) => Err(error),
            Err(error) => Err(ClientError::new_with_status(status.as_u16(), error)),
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
