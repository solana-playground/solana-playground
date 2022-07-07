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

// Export sdk for stand-alone use of wasm client without specifying sdk as dependency
pub use solana_sdk;

// For root level imports
pub use {
    client::WasmClient, error::ClientError, request::ClientRequest, response::ClientResponse,
};

pub type ClientResult<T> = std::result::Result<T, error::ClientError>;
