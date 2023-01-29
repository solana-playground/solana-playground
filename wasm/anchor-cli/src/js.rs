use wasm_bindgen::prelude::*;

#[wasm_bindgen(raw_module = "/src/utils/pg/connection.ts")]
extern "C" {
    pub type PgConnection;

    #[wasm_bindgen(static_method_of = PgConnection, getter)]
    pub fn endpoint() -> String;

    #[wasm_bindgen(static_method_of = PgConnection, getter)]
    pub fn commitment() -> String;
}

#[wasm_bindgen(raw_module = "/src/utils/pg/wallet.ts")]
extern "C" {
    pub type PgWallet;

    #[wasm_bindgen(static_method_of = PgWallet, getter, js_name = "keypairBytes")]
    pub fn keypair_bytes() -> Vec<u8>;
}

#[wasm_bindgen(raw_module = "/src/utils/pg/program-info.ts")]
extern "C" {
    pub type PgProgramInfo;

    #[wasm_bindgen(static_method_of = PgProgramInfo, getter, js_name = "idlStr")]
    pub fn idl_string() -> Option<String>;

    #[wasm_bindgen(static_method_of = PgProgramInfo, getter, js_name = "pkStr")]
    pub fn pk_string() -> Option<String>;
}
