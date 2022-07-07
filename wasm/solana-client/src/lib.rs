#![allow(dead_code)]
#![allow(deprecated)]

#[macro_use]
extern crate serde_derive;

pub mod utils;

mod client;
mod constants;
mod error;
mod methods;
mod provider;
mod request;
mod response;

// Export commitment config for stand-alone use of wasm client without sdk
pub use solana_sdk::commitment_config;
pub use {
    client::WasmClient, error::ClientError, request::ClientRequest, response::ClientResponse,
};

pub type ClientResult<T> = std::result::Result<T, error::ClientError>;
