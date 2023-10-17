use std::str::FromStr;

use anchor_lang::prelude::Pubkey;
use anchor_syn::idl::types::Idl;
use anyhow::anyhow;
use solana_client_wasm::WasmClient;
use solana_playground_utils_wasm::js::{PgProgramInfo, PgSettings, PgWallet};
use solana_sdk::{
    commitment_config::{CommitmentConfig, CommitmentLevel},
    signature::Keypair,
};

use crate::cli::CliResult;

pub fn get_client() -> WasmClient {
    let connection_settings = PgSettings::connection();
    WasmClient::new_with_commitment(
        &connection_settings.endpoint(),
        CommitmentConfig {
            commitment: match connection_settings.commitment().as_str() {
                "processed" => CommitmentLevel::Processed,
                "confirmed" => CommitmentLevel::Confirmed,
                "finalized" => CommitmentLevel::Finalized,
                _ => CommitmentLevel::Confirmed,
            },
        },
    )
}

pub fn get_keypair() -> Keypair {
    Keypair::from_bytes(&PgWallet::keypair_bytes()).unwrap()
}

pub fn get_idl() -> CliResult<Idl> {
    match PgProgramInfo::idl_string().map(|idl_string| serde_json::from_str(&idl_string).unwrap()) {
        Some(idl) => Ok(idl),
        None => Err(anyhow!("IDL not found")),
    }
}

pub fn get_program_id(maybe_program_id: Option<Pubkey>) -> CliResult<Pubkey> {
    match maybe_program_id {
        Some(program_id) => Ok(program_id),
        None => match PgProgramInfo::pk_string() {
            Some(program_id_string) => Ok(Pubkey::from_str(&program_id_string).unwrap()),
            None => Err(anyhow!("Program id doesn't exist")),
        },
    }
}
