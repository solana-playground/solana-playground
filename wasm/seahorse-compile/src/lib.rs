use seahorse_lang::core::compile;
use solana_playground_utils_wasm::js::PgTerminal;
use std::panic;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = "compileSeahorse")]
pub fn compile_wasm(python_source: String, program_name: String) -> String {
    panic::set_hook(Box::new(console_error_panic_hook::hook));

    match compile(python_source, program_name) {
        Ok(rust_source) => rust_source,
        Err(e) => {
            // Log the compile error to Playground terminal
            PgTerminal::log_wasm(&e.to_string());
            // Enable terminal
            PgTerminal::enable();
            return String::new();
        }
    }
}
