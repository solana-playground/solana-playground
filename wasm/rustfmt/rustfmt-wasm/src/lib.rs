// Fork of https://github.com/alexcrichton/rustfmt-wasm
//
// The patches in the repo including the crates.io patches did not work so had to get the
// rustc deps at the time of the repo creation.
//
// Though this repository is from 2018, it still does a good job at formatting rust code.
// 
// One would need to compile `rustc-dev` to wasm in order to make recent versions of rustfmt
// to compile to wasm. See: https://github.com/rust-lang/rustfmt/issues/4845

extern crate console_error_panic_hook;
extern crate rustfmt_nightly;
extern crate wasm_bindgen;

use rustfmt_nightly::{Config, ErrorKind, FormatReport, Input, Session};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn rustfmt(input: &str) -> RustfmtResult {
    console_error_panic_hook::set_once();

    let mut config = Config::default();
    config.override_value("emit_mode", "stdout");
    let mut dst = Vec::new();
    let report = {
        let mut session = Session::new(config, Some(&mut dst));
        let report = match session.format(Input::Text(input.to_string())) {
            Ok(report) => report,
            Err(err) => {
                return RustfmtResult {
                    content: String::new(),
                    state: Err(err),
                }
            }
        };
        report
    };

    RustfmtResult {
        content: String::from_utf8(dst).unwrap(),
        state: Ok(report),
    }
}

#[wasm_bindgen]
pub struct RustfmtResult {
    content: String,
    state: Result<FormatReport, ErrorKind>,
}

#[wasm_bindgen]
impl RustfmtResult {
    pub fn code(self) -> String {
        self.content
    }

    pub fn error(&self) -> Option<String> {
        self.state.as_ref().err().map(|s| s.to_string())
    }
}
