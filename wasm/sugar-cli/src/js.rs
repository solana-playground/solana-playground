use wasm_bindgen::prelude::*;

type BundlrAction = u8;

#[wasm_bindgen(raw_module = "/src/commands/sugar/processor.ts")]
extern "C" {
    pub type PgSugar;

    #[wasm_bindgen(static_method_of = PgSugar)]
    pub async fn bundlr(rpc_url: Option<String>, action: BundlrAction);

    #[wasm_bindgen(static_method_of = PgSugar, js_name = "collectionSet")]
    pub async fn collection_set(
        rpc_url: Option<String>,
        candy_machine: Option<String>,
        collection_mint: String,
    );

    #[wasm_bindgen(static_method_of = PgSugar, js_name = "createConfig")]
    pub async fn create_config(rpc_url: Option<String>);

    #[wasm_bindgen(static_method_of = PgSugar)]
    pub async fn deploy(rpc_url: Option<String>);

    #[wasm_bindgen(static_method_of = PgSugar, js_name = "guardAdd")]
    pub async fn guard_add(
        rpc_url: Option<String>,
        candy_machine: Option<String>,
        candy_guard: Option<String>,
    );

    #[wasm_bindgen(static_method_of = PgSugar, js_name = "guardRemove")]
    pub async fn guard_remove(
        rpc_url: Option<String>,
        candy_machine: Option<String>,
        candy_guard: Option<String>,
    );

    #[wasm_bindgen(static_method_of = PgSugar, js_name = "guardShow")]
    pub async fn guard_show(rpc_url: Option<String>, candy_guard: Option<String>);

    #[wasm_bindgen(static_method_of = PgSugar, js_name = "guardUpdate")]
    pub async fn guard_update(rpc_url: Option<String>, candy_guard: Option<String>);

    #[wasm_bindgen(static_method_of = PgSugar, js_name = "guardWithdraw")]
    pub async fn guard_withdraw(rpc_url: Option<String>, candy_guard: Option<String>);

    #[wasm_bindgen(static_method_of = PgSugar)]
    pub async fn hash(compare: Option<String>);

    #[wasm_bindgen(static_method_of = PgSugar)]
    pub async fn launch(rpc_url: Option<String>, strict: bool, skip_collection_prompt: bool);

    #[wasm_bindgen(static_method_of = PgSugar)]
    pub async fn mint(
        rpc_url: Option<String>,
        number: Option<u64>,
        receiver: Option<String>,
        candy_machine: Option<String>,
    );

    #[wasm_bindgen(static_method_of = PgSugar)]
    pub async fn reveal(rpc_url: Option<String>);

    #[wasm_bindgen(static_method_of = PgSugar)]
    pub async fn show(rpc_url: Option<String>, candy_machine: Option<String>, unminted: bool);

    #[wasm_bindgen(static_method_of = PgSugar)]
    pub async fn sign(
        rpc_url: Option<String>,
        mint: Option<String>,
        candy_machine_id: Option<String>,
    );

    #[wasm_bindgen(static_method_of = PgSugar)]
    pub async fn update(
        rpc_url: Option<String>,
        new_authority: Option<String>,
        candy_machine: Option<String>,
    );

    #[wasm_bindgen(static_method_of = PgSugar)]
    pub async fn upload(rpc_url: Option<String>);

    #[wasm_bindgen(static_method_of = PgSugar)]
    pub async fn validate(strict: bool, skip_collection_prompt: bool);

    #[wasm_bindgen(static_method_of = PgSugar)]
    pub async fn verify(rpc_url: Option<String>);

    #[wasm_bindgen(static_method_of = PgSugar)]
    pub async fn withdraw(candy_machine: Option<String>, rpc_url: Option<String>, list: bool);
}
