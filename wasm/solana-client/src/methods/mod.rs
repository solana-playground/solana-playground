#![allow(unused_imports)]

mod account_info;
mod balance;
mod block;
mod block_commitment;
mod block_height;
mod block_production;
mod block_time;
mod blockhash_valid;
mod blocks;
mod blocks_with_limit;
mod cluster_nodes;
mod epoch_info;
mod epoch_schedule;
mod fee_for_message;
mod first_available_block;
mod genesis_hash;
mod health;
mod highest_snapshot_slot;
mod identity;
mod inflation_governor;
mod inflation_rate;
mod inflation_reward;
mod largest_accounts;
mod latest_blockhash;
mod leader_schedule;
mod max_retransmit_slot;
mod max_shred_insert_slot;
mod minimum_balance_for_rent_exemption;
mod minimum_ledger_slot;
mod multiple_accounts;
mod program_accounts;
mod recent_performance_samples;
mod recent_prioritization_fees;
mod request_airdrop;
mod send_transaction;
mod signature_statuses;
mod signatures_for_address;
mod simulate_transaction;
mod slot;
mod slot_leader;
mod slot_leaders;
mod stake_activation;
mod stake_minimum_delegation;
mod supply;
mod token_account_balance;
mod token_accounts_by_delegate;
mod token_accounts_by_owner;
mod token_largest_accounts;
mod token_supply;
mod transaction;
mod transaction_count;
mod version;
mod vote_accounts;

use serde::{Deserialize, Serialize};
use serde_with::{serde_as, DisplayFromStr};
use solana_sdk::pubkey::Pubkey;
pub use {
    account_info::{GetAccountInfoRequest, GetAccountInfoResponse},
    balance::{GetBalanceRequest, GetBalanceResponse},
    block::{GetBlockRequest, GetBlockResponse},
    block_commitment::{GetBlockCommitmentRequest, GetBlockCommitmentResponse},
    block_height::{GetBlockHeightRequest, GetBlockHeightResponse},
    block_production::{GetBlockProductionRequest, GetBlockProductionResponse},
    block_time::{GetBlockTimeRequest, GetBlockTimeResponse},
    blockhash_valid::{IsBlockhashValidRequest, IsBlockhashValidResponse},
    blocks::{GetBlocksRequest, GetBlocksResponse},
    blocks_with_limit::{GetBlocksWithLimitRequest, GetBlocksWithLimitResponse},
    cluster_nodes::{GetClusterNodesRequest, GetClusterNodesResponse, RpcContactInfoWasm},
    epoch_info::{GetEpochInfoRequest, GetEpochInfoResponse},
    epoch_schedule::{GetEpochScheduleRequest, GetEpochScheduleResponse},
    fee_for_message::{GetFeeForMessageRequest, GetFeeForMessageResponse},
    first_available_block::{GetFirstAvailableBlockRequest, GetFirstAvailableBlockResponse},
    genesis_hash::{GetGenesisHashRequest, GetGenesisHashResponse},
    health::{GetHealthRequest, GetHealthResponse},
    highest_snapshot_slot::{GetHighestSnapshotSlotRequest, GetHighestSnapshotSlotResponse},
    identity::{GetIdentityRequest, GetIdentityResponse},
    inflation_governor::{GetInflationGovernorRequest, GetInflationGovernorResponse},
    inflation_rate::{GetInflationRateRequest, GetInflationRateResponse},
    inflation_reward::{GetInflationRewardRequest, GetInflationRewardResponse},
    largest_accounts::{GetLargestAccountsRequest, GetLargestAccountsResponse},
    latest_blockhash::{GetLatestBlockhashRequest, GetLatestBlockhashResponse},
    leader_schedule::{GetLeaderScheduleRequest, GetLeaderScheduleResponse},
    max_retransmit_slot::{GetMaxRetransmitSlotRequest, GetMaxRetransmitSlotResponse},
    max_shred_insert_slot::{GetMaxShredInsertSlotRequest, GetMaxShredInsertSlotResponse},
    minimum_balance_for_rent_exemption::{
        GetMinimumBalanceForRentExemptionRequest, GetMinimumBalanceForRentExemptionResponse,
    },
    minimum_ledger_slot::{MinimumLedgerSlotRequest, MinimumLedgerSlotResponse},
    multiple_accounts::{GetMultipleAccountsRequest, GetMultipleAccountsResponse},
    program_accounts::{GetProgramAccountsRequest, GetProgramAccountsResponse},
    recent_performance_samples::{
        GetRecentPerformanceSamplesRequest, GetRecentPerformanceSamplesResponse,
    },
    recent_prioritization_fees::{
        GetRecentPrioritizationFeesRequest, GetRecentPrioritizationFeesResponse,
    },
    request_airdrop::{RequestAirdropRequest, RequestAirdropResponse},
    send_transaction::{SendTransactionRequest, SendTransactionResponse},
    signature_statuses::{
        GetSignatureStatusesRequest, GetSignatureStatusesResponse, SignatureStatusesValue,
    },
    signatures_for_address::{GetSignaturesForAddressRequest, GetSignaturesForAddressResponse},
    simulate_transaction::{SimulateTransactionRequest, SimulateTransactionResponse},
    slot::{GetSlotRequest, GetSlotResponse},
    slot_leader::{GetSlotLeaderRequest, GetSlotLeaderResponse},
    slot_leaders::{GetSlotLeadersRequest, GetSlotLeadersResponse},
    stake_activation::{GetStakeActivationRequest, GetStakeActivationResponse},
    stake_minimum_delegation::{
        GetStakeMinimumDelegationRequest, GetStakeMinimumDelegationResponse,
    },
    supply::{GetSupplyRequest, GetSupplyResponse},
    token_account_balance::{GetTokenAccountBalanceRequest, GetTokenAccountBalanceResponse},
    token_accounts_by_delegate::{
        GetTokenAccountsByDelegateRequest, GetTokenAccountsByDelegateResponse,
    },
    token_accounts_by_owner::{GetTokenAccountsByOwnerRequest, GetTokenAccountsByOwnerResponse},
    token_largest_accounts::{GetTokenLargestAccountsRequest, GetTokenLargestAccountsResponse},
    token_supply::{GetTokenSupplyRequest, GetTokenSupplyResponse},
    transaction::{GetTransactionRequest, GetTransactionResponse},
    transaction_count::{GetTransactionCountRequest, GetTransactionCountResponse},
    version::{GetVersionRequest, GetVersionResponse},
    vote_accounts::{GetVoteAccountsRequest, GetVoteAccountsResponse},
};

#[derive(Debug, PartialEq, Deserialize)]
pub struct Context {
    slot: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlockProductionRange {
    pub first_slot: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_slot: Option<u64>,
}

pub trait Method: Serialize {
    const NAME: &'static str;
}

#[macro_export]
macro_rules! impl_method {
    ($ident:ident, $name:literal) => {
        impl $crate::methods::Method for $ident {
            const NAME: &'static str = $name;
        }
    };
}
