#![no_std]

use quasar_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
mod my_program {
    use super::*;

    #[instruction(0)]
    pub fn noop(_ctx: Ctx<Noop>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Noop {
    pub signer: Signer,
}
