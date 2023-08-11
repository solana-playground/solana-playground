use base_db::ProcMacro;
use cargo_toml::Manifest;

// TODO: Find a way to expand proc macros in the browser.
/// Get proc macros from the given lib.
pub fn get_proc_macros(_lib: &str) -> Vec<ProcMacro> {
    vec![]
}

/// Get whether the crate is a proc macro crate from manifest.
pub fn get_is_proc_macro(manifest: &Manifest) -> bool {
    manifest
        .lib
        .as_ref()
        .map(|lib| lib.proc_macro)
        .unwrap_or_default()
}
