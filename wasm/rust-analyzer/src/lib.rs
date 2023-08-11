//! This crate is a fork of https://github.com/rust-analyzer/rust-analyzer-wasm

mod proc_macro;
mod return_types;
mod snippet;
mod to_proto;
mod utils;
mod world_state;

use wasm_bindgen::prelude::*;

// Export rayon thread pool
pub use wasm_bindgen_rayon::init_thread_pool;

/// Show better error messages.
#[wasm_bindgen(start)]
pub fn start() {
    console_error_panic_hook::set_once();
}
