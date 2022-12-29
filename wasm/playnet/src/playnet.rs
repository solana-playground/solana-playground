// Playnet creates a minimal custom runtime to allow testing Solana programs
// in browsers(though not limited to) without restrictions with the help of WASM.
//
// Playnet is not `solana-test-validator`, it's specifically designed for single
// user in mind to consume as little resources as possible.

use std::{rc::Rc, sync::RwLock};

use wasm_bindgen::prelude::*;

use crate::{rpc::PgRpc, runtime::bank::PgBank};

#[wasm_bindgen]
pub struct Playnet {
    /// RPC methods to interact with the Playnet
    #[wasm_bindgen(getter_with_clone)]
    pub rpc: PgRpc,

    /// Reference to the bank
    bank: Rc<RwLock<PgBank>>,
}

#[wasm_bindgen]
impl Playnet {
    /// Playnet lifecycle starts after constructing a Playnet instance
    #[wasm_bindgen(constructor)]
    pub fn new(maybe_bank_string: Option<String>) -> Self {
        // Get WASM errors in console
        console_error_panic_hook::set_once();

        // Create the bank
        let bank = Rc::new(RwLock::new(PgBank::new(maybe_bank_string)));

        Self {
            rpc: PgRpc::new(Rc::clone(&bank)),
            bank: Rc::clone(&bank),
        }
    }

    /// Get the save data necessary to recover from the next time Playnet instance gets created
    #[wasm_bindgen(js_name = getSaveData)]
    pub fn get_save_data(&self) -> String {
        serde_json::to_string(&*self.bank.read().unwrap()).unwrap()
    }
}
