use clap::ArgMatches;
use solana_clap_v3_utils_wasm::{
    input_parsers::{pubkey_of, value_of},
    nonce::NONCE_ARG,
    offline::{BLOCKHASH_ARG, SIGN_ONLY_ARG},
};
use solana_client_wasm::utils::rpc_config::BlockhashQuery;

pub fn blockhash_query_from_matches(matches: &ArgMatches) -> BlockhashQuery {
    let blockhash = value_of(matches, BLOCKHASH_ARG.name);
    let sign_only = matches.is_present(SIGN_ONLY_ARG.name);
    let nonce_account = pubkey_of(matches, NONCE_ARG.name);
    BlockhashQuery::new(blockhash, sign_only, nonce_account)
}
