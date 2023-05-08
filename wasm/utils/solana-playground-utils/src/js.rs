use wasm_bindgen::prelude::*;

#[wasm_bindgen(raw_module = "/src/utils/pg/connection.ts")]
extern "C" {
    pub type PgConnection;

    /// Get the RPC endpoint.
    #[wasm_bindgen(static_method_of = PgConnection, getter)]
    pub fn endpoint() -> String;

    /// Get the connection commitment.
    #[wasm_bindgen(static_method_of = PgConnection, getter)]
    pub fn commitment() -> String;

    /// Update connection.
    #[wasm_bindgen(static_method_of = PgConnection, js_name = "updateWasm")]
    pub fn update_wasm(endpoint: &str, commitment: &str);
}

#[wasm_bindgen(raw_module = "/src/utils/pg/program-info.ts")]
extern "C" {
    pub type PgProgramInfo;

    /// Get the current program's IDL.
    #[wasm_bindgen(static_method_of = PgProgramInfo, getter, js_name = "idlStr")]
    pub fn idl_string() -> Option<String>;

    /// Get the current program's pubkey
    #[wasm_bindgen(static_method_of = PgProgramInfo, getter, js_name = "pkStr")]
    pub fn pk_string() -> Option<String>;
}

#[wasm_bindgen(raw_module = "/src/utils/pg/terminal/terminal.ts")]
extern "C" {
    pub type PgTerminal;

    // TODO: Remove, there is no need for a new WASM function since `PgTerminal.log` is now static.
    /// Log to the playground terminal.
    #[wasm_bindgen(static_method_of = PgTerminal, js_name = "logWasm")]
    pub fn log_wasm(msg: &str);

    /// Enable the playground terminal.
    #[wasm_bindgen(static_method_of = PgTerminal, js_name = "enable")]
    pub fn enable();

}

#[wasm_bindgen(raw_module = "/src/utils/pg/wallet.ts")]
extern "C" {
    pub type PgWallet;

    /// Get playground wallet's keypair
    #[wasm_bindgen(static_method_of = PgWallet, getter, js_name = "keypairBytes")]
    pub fn keypair_bytes() -> Vec<u8>;
}
