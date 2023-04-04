# Solana WASM Client

[![Crates.io](https://img.shields.io/crates/v/solana-client-wasm.svg)](https://crates.io/crates/solana-client-wasm) [![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://github.com/solana-playground/solana-playground/blob/master/LICENSE-APACHE)

Non-blocking implementation of WASM compatible Solana Client.

## Usage

Most methods are identical to [solana-client](https://docs.rs/solana-client/1.11.0/solana_client/nonblocking/rpc_client/struct.RpcClient.html) non-blocking API.

[solana-sdk](https://docs.rs/solana-sdk/1.14.16/solana_sdk/index.html) is exported which means you don't need to add it to your dependencies.

## Example

```rust
use solana_client_wasm::{
    solana_sdk::signature::{Keypair, Signer},
    WasmClient,
};

// Create client
let client = WasmClient::new("https://api.devnet.solana.com");

// Get a random pubkey
let pubkey = Keypair::new().pubkey();

// Get balance
let balance = client.get_balance(&pubkey).await?; // in lamports
log::info!("Balance is {balance}"); // 0
```

## WebSocket

Requires `pubsub` crate feature to be activated.

Current implementation depends on [web-sys](https://docs.rs/web-sys/0.3.60/web_sys/) and [js-sys](https://docs.rs/js-sys/0.3.60/js_sys/) crates and is intended to work only in browsers.

```rust
// Create a client
let client = WasmClient::new("https://api.devnet.solana.com");

// Subscribe to changes
let id = client
    .account_subscribe(pubkey, |data| {
        // Handle change...
    })
    .await;

// Unsubscribe when its no longer being used to prevent memory leak
client.account_unsubscribe(id).await;
```
