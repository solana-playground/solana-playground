#![allow(dead_code, deprecated)]

#[macro_use]
extern crate serde_derive;

mod client;
mod constants;
mod error;
mod methods;
mod provider;
mod request;
mod response;

#[cfg(feature = "pubsub")]
mod pubsub;

pub mod utils;

// Export sdk for stand-alone use of wasm client without specifying sdk as dependency
pub use solana_sdk;

// For root level imports
pub use {
    client::WasmClient, error::ClientError, request::ClientRequest, response::ClientResponse,
};

pub type ClientResult<T> = std::result::Result<T, error::ClientError>;
