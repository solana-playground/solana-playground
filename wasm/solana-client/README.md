# Solana WASM Client

[![Crates.io](https://img.shields.io/crates/v/solana-client-wasm.svg)](https://crates.io/crates/solana-client-wasm) [![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://github.com/solana-playground/solana-playground/blob/master/LICENSE-APACHE)

Non-blocking implementation of WASM compatible Solana Client.

## Usage

You can use [solana-client](https://docs.rs/solana-client/1.11.0/solana_client/nonblocking/rpc_client/struct.RpcClient.html) non-blocking API.

[solana-sdk](https://docs.rs/solana-sdk/1.11.0/solana_sdk/index.html) is exported from the lib so you don't need to add it to your dependencies.

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
