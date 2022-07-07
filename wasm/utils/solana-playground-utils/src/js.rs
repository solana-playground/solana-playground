use wasm_bindgen::prelude::*;

#[wasm_bindgen(raw_module = "/src/utils/pg/terminal/terminal.ts")]
extern "C" {
    pub type PgTerminal;

    #[wasm_bindgen(static_method_of = PgTerminal, js_name = "logWasm")]
    pub fn log_wasm(msg: &str);

    #[wasm_bindgen(static_method_of = PgTerminal, js_name = "enable")]
    pub fn enable();

}

#[wasm_bindgen(raw_module = "/src/utils/pg/connection.ts")]
extern "C" {
    pub type PgConnection;

    #[wasm_bindgen(static_method_of = PgConnection, js_name = "updateWasm")]
    pub fn update_wasm(endpoint: &str, commitment: &str);
}
