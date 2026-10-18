#![no_std]

use pinocchio::{entrypoint, AccountView, Address, ProgramResult};
use pinocchio_log::log;

entrypoint!(process_instruction);

// Prefix parameters with `_` to indicate they're not being used and suppress Rust warnings
pub fn process_instruction(
    _program_id: &Address,
    _accounts: &mut [AccountView],
    _instruction_data: &[u8],
) -> ProgramResult {
    log!("Hello, World!");
    Ok(())
}
