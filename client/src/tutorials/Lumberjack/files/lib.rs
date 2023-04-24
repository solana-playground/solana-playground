use anchor_lang::prelude::*;

declare_id!("4ayoaXt8odfcNneUuZPeiYQfSCDH4XyG8iEkaPK2pUHx");

const MAX_ENERGY: u64 = 5;
const TIME_TO_REFILL_ENERGY: i64 = 30;

#[program]
pub mod lumberjack {
    use super::*;

    pub fn init_player(ctx: Context<InitPlayer>) -> Result<()> {
        ctx.accounts.player.energy = MAX_ENERGY;
        ctx.accounts.player.last_login = Clock::get()?.unix_timestamp;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitPlayer<'info> {
    #[account( 
        init, 
        payer = signer,
        space = 1000,
        seeds = [b"player", signer.key().as_ref()],
        bump,
    )]
    pub player: Account<'info, PlayerData>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct PlayerData {
    pub name: String,
    pub level: u8,
    pub xp: u64,
    pub wood: u64,
    pub energy: u64,
    pub last_login: i64,
}
