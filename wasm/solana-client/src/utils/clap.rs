// These utilities are copied from solana-clap-v3-utils-wasm
// We don't need/want to upload solana-clap-v3-utils-wasm to crates.io

pub struct ArgConstant<'a> {
    pub long: &'a str,
    pub name: &'a str,
    pub help: &'a str,
}

pub mod input_parsers {
    use clap::ArgMatches;
    use solana_sdk::{
        pubkey::Pubkey,
        signature::{Keypair, Signer},
    };

    pub fn value_of<T>(matches: &ArgMatches, name: &str) -> Option<T>
    where
        T: std::str::FromStr,
        <T as std::str::FromStr>::Err: std::fmt::Debug,
    {
        if let Some(value) = matches.value_of(name) {
            value.parse::<T>().ok()
        } else {
            None
        }
    }

    // NOTE: we are not supporting ASK keyword yet.
    pub fn keypair_of(_matches: &ArgMatches, _name: &str) -> Option<Keypair> {
        None
    }

    pub fn pubkey_of(matches: &ArgMatches, name: &str) -> Option<Pubkey> {
        value_of(matches, name)
            .or_else(|| keypair_of(matches, name).map(|keypair| keypair.pubkey()))
    }
}

pub mod nonce {
    use super::ArgConstant;

    pub const NONCE_ARG: ArgConstant<'static> = ArgConstant {
        name: "nonce",
        long: "nonce",
        help: "Provide the nonce account to use when creating a nonced \n\
               transaction. Nonced transactions are useful when a transaction \n\
               requires a lengthy signing process. Learn more about nonced \n\
               transactions at https://docs.solana.com/offline-signing/durable-nonce",
    };
}

pub mod offline {
    use super::ArgConstant;

    pub const BLOCKHASH_ARG: ArgConstant<'static> = ArgConstant {
        name: "blockhash",
        long: "blockhash",
        help: "Use the supplied blockhash",
    };

    pub const SIGN_ONLY_ARG: ArgConstant<'static> = ArgConstant {
        name: "sign_only",
        long: "sign-only",
        help: "Sign the transaction offline",
    };
}
