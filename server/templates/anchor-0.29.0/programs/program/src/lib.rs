use anchor_lang::prelude::*;

// This is your program's public key and it will update automatically when you build.
declare_id!("11111111111111111111111111111111");

#[program]
mod my_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {
        ctx.accounts.my_account.data = data;
        msg!("Changed data to: {}!", data); // Message will show up in the logs
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// We must specify the space in order to initialize an account.
    ///
    /// First 8 bytes are default account discriminator, next 8 bytes come from `MyAccount.data`
    /// being type `u64` (64 bits unsigned integer = 8 bytes).
    #[account(init, payer = signer, space = 8 + 8)]
    pub my_account: Account<'info, MyAccount>,

    /// A signer is required for program account initialization. The account must also be mutable
    /// (`mut`) because it will pay for the account creation.
    #[account(mut)]
    pub signer: Signer<'info>,

    /// System program is required for program account initialization.
    pub system_program: Program<'info, System>,
}

#[account]
pub struct MyAccount {
    data: u64,
}
