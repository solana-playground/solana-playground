use std::{panic, path::PathBuf, str::FromStr};

use seahorse_dev::core::{compile, Tree};
use solana_playground_utils_wasm::js::PgTerminal;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = "compileSeahorse")]
pub fn compile_seahorse(python_source: String, program_name: String) -> Vec<JsValue> {
    panic::set_hook(Box::new(console_error_panic_hook::hook));

    // Seahorse gives a file tree relative to the src/ directory
    // Playground expects to include the src/ prefix on files
    let base_path: PathBuf = PathBuf::from_str("/src").unwrap();

    match compile(python_source, program_name, Some(base_path.clone())) {
        Ok(out_tree) => build_src_tree(&out_tree.tree, base_path)
            // we need to change from Vec<String> to Vec<JsValue> for wasm-bindgen
            .iter()
            .map(|s| JsValue::from_str(s))
            .collect::<Vec<_>>(),
        Err(e) => {
            // Log the compile error to Playground terminal
            PgTerminal::log_wasm(&e.to_string());
            vec![]
        }
    }
}

/// Convert the Seahorse file tree to an array that we can return via wasm
/// Seahorse gives a file tree.
/// The nodes are the file path (eg. `dot` -> `mod`) would be dot/mod.rs
/// The leaves are the rust content of the file
/// We output to wasm an array of flattened tuples [filepath, content, filepath, content]
fn build_src_tree(tree: &Tree<String>, path: PathBuf) -> Vec<String> {
    match tree {
        Tree::Leaf(src) => {
            // We add the `.rs` extension to each file
            let path = path.with_extension("rs").to_str().unwrap().to_owned();
            vec![path, src.to_string()]
        }

        Tree::Node(node) => node
            // Recursively find the leaves from this node and flatten
            .iter()
            .flat_map(|(subpath, subtree)| build_src_tree(subtree, path.join(subpath)))
            .collect::<Vec<_>>(),
    }
}
