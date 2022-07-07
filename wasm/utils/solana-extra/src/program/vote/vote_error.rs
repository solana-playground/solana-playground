//! Vote program errors

use {
    num_derive::{FromPrimitive, ToPrimitive},
    solana_sdk::decode_error::DecodeError,
    thiserror::Error,
};

/// Reasons the vote might have had an error
#[derive(Error, Debug, Clone, PartialEq, Eq, FromPrimitive, ToPrimitive)]
pub enum VoteError {
    #[error("vote already recorded or not in slot hashes history")]
    VoteTooOld,

    #[error("vote slots do not match bank history")]
    SlotsMismatch,

    #[error("vote hash does not match bank hash")]
    SlotHashMismatch,

    #[error("vote has no slots, invalid")]
    EmptySlots,

    #[error("vote timestamp not recent")]
    TimestampTooOld,

    #[error("authorized voter has already been changed this epoch")]
    TooSoonToReauthorize,

    // TODO: figure out how to migrate these new errors
    #[error("Old state had vote which should not have been popped off by vote in new state")]
    LockoutConflict,

    #[error("Proposed state had earlier slot which should have been popped off by later vote")]
    NewVoteStateLockoutMismatch,

    #[error("Vote slots are not ordered")]
    SlotsNotOrdered,

    #[error("Confirmations are not ordered")]
    ConfirmationsNotOrdered,

    #[error("Zero confirmations")]
    ZeroConfirmations,

    #[error("Confirmation exceeds limit")]
    ConfirmationTooLarge,

    #[error("Root rolled back")]
    RootRollBack,

    #[error("Confirmations for same vote were smaller in new proposed state")]
    ConfirmationRollBack,

    #[error("New state contained a vote slot smaller than the root")]
    SlotSmallerThanRoot,

    #[error("New state contained too many votes")]
    TooManyVotes,

    #[error("every slot in the vote was older than the SlotHashes history")]
    VotesTooOldAllFiltered,

    #[error("Proposed root is not in slot hashes")]
    RootOnDifferentFork,
}

impl<E> DecodeError<E> for VoteError {
    fn type_of() -> &'static str {
        "VoteError"
    }
}
