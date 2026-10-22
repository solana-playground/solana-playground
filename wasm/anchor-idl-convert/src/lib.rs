use wasm_bindgen::prelude::*;

// TODO: This could be implemented in `anchor-cli-wasm` and exposed via `anchor idl convert` similar
// to how the actual CLI works. Currently added as a separate crate because all WASM crates need
// some work to update deps and get rid of redundant code.
#[wasm_bindgen(js_name = convertIdl)]
pub fn convert_idl(idl: &str) -> Result<String, JsValue> {
    anchor_lang_idl::convert::convert_idl(idl.as_bytes())
        .map(|idl| serde_json::to_string(&idl).unwrap())
        .map_err(|e| JsValue::from_str(&format!("IDL conversion failed: {e}")))
}
