use solana_client_wasm::WasmClient;
use solana_client_wasm::{ClientError, ClientResult};
use solana_sdk::{
    commitment_config::CommitmentConfig, message::Message, native_token::lamports_to_sol,
    pubkey::Pubkey,
};

use crate::cli::CliError;

pub async fn check_account_for_fee(
    rpc_client: &WasmClient,
    account_pubkey: &Pubkey,
    message: &Message,
) -> Result<(), CliError> {
    check_account_for_multiple_fees(rpc_client, account_pubkey, &[message]).await
}

pub async fn check_account_for_fee_with_commitment(
    rpc_client: &WasmClient,
    account_pubkey: &Pubkey,
    message: &Message,
    commitment: CommitmentConfig,
) -> Result<(), CliError> {
    check_account_for_multiple_fees_with_commitment(
        rpc_client,
        account_pubkey,
        &[message],
        commitment,
    )
    .await
}

pub async fn check_account_for_multiple_fees(
    rpc_client: &WasmClient,
    account_pubkey: &Pubkey,
    messages: &[&Message],
) -> Result<(), CliError> {
    check_account_for_multiple_fees_with_commitment(
        rpc_client,
        account_pubkey,
        messages,
        CommitmentConfig::default(),
    )
    .await
}

pub async fn check_account_for_multiple_fees_with_commitment(
    rpc_client: &WasmClient,
    account_pubkey: &Pubkey,
    messages: &[&Message],
    commitment: CommitmentConfig,
) -> Result<(), CliError> {
    check_account_for_spend_multiple_fees_with_commitment(
        rpc_client,
        account_pubkey,
        0,
        messages,
        commitment,
    )
    .await
}

pub async fn check_account_for_spend_multiple_fees_with_commitment(
    rpc_client: &WasmClient,
    account_pubkey: &Pubkey,
    balance: u64,
    messages: &[&Message],
    commitment: CommitmentConfig,
) -> Result<(), CliError> {
    let fee = get_fee_for_messages(rpc_client, messages).await?;
    check_account_for_spend_and_fee_with_commitment(
        rpc_client,
        account_pubkey,
        balance,
        fee,
        commitment,
    )
    .await
}

pub async fn check_account_for_spend_and_fee_with_commitment(
    rpc_client: &WasmClient,
    account_pubkey: &Pubkey,
    balance: u64,
    fee: u64,
    commitment: CommitmentConfig,
) -> Result<(), CliError> {
    if !check_account_for_balance_with_commitment(
        rpc_client,
        account_pubkey,
        balance + fee,
        commitment,
    )
    .await
    .map_err(Into::<ClientError>::into)?
    {
        if balance > 0 {
            return Err(CliError::InsufficientFundsForSpendAndFee(
                lamports_to_sol(balance),
                lamports_to_sol(fee),
                *account_pubkey,
            ));
        } else {
            return Err(CliError::InsufficientFundsForFee(
                lamports_to_sol(fee),
                *account_pubkey,
            ));
        }
    }
    Ok(())
}

pub async fn get_fee_for_messages(
    rpc_client: &WasmClient,
    messages: &[&Message],
) -> Result<u64, CliError> {
    let mut total_fee = 0u64;
    for message in messages {
        let fee = rpc_client.get_fee_for_message(message).await?;
        total_fee += fee;
    }

    Ok(total_fee)
}

pub async fn check_account_for_balance(
    rpc_client: &WasmClient,
    account_pubkey: &Pubkey,
    balance: u64,
) -> ClientResult<bool> {
    check_account_for_balance_with_commitment(
        rpc_client,
        account_pubkey,
        balance,
        CommitmentConfig::default(),
    )
    .await
}

pub async fn check_account_for_balance_with_commitment(
    rpc_client: &WasmClient,
    account_pubkey: &Pubkey,
    balance: u64,
    commitment_config: CommitmentConfig,
) -> ClientResult<bool> {
    let lamports = rpc_client
        .get_balance_with_commitment(account_pubkey, commitment_config)
        .await?;
    if lamports != 0 && lamports >= balance {
        return Ok(true);
    }
    Ok(false)
}

pub fn check_unique_pubkeys(
    pubkey0: (&Pubkey, String),
    pubkey1: (&Pubkey, String),
) -> Result<(), CliError> {
    if pubkey0.0 == pubkey1.0 {
        Err(CliError::BadParameter(format!(
            "Identical pubkeys found: `{}` and `{}` must be unique",
            pubkey0.1, pubkey1.1
        )))
    } else {
        Ok(())
    }
}
