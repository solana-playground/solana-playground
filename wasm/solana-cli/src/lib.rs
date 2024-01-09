#![allow(clippy::arithmetic_side_effects)]
#![allow(dead_code)]

macro_rules! ACCOUNT_STRING {
    () => {
        r#", one of:
        * a base58-encoded public key"#
    };
}

macro_rules! pubkey {
    ($arg:expr, $help:expr) => {
        $arg.takes_value(true)
            .validator(solana_clap_v3_utils_wasm::input_validators::is_valid_pubkey)
            .help(concat!($help, ACCOUNT_STRING!()))
    };
}

#[macro_use]
extern crate const_format;

mod clap;
mod cli;
mod commands;
mod utils;
mod wasm;
