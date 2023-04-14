use anchor_lang::prelude::*;

declare_id!("4ayoaXt8odfcNneUuZPeiYQfSCDH4XyG8iEkaPK2pUHx");

#[error_code]
pub enum ErrorCode {
    #[msg("Not enough energy")]
    NotEnoughEnergy,
}

const TIME_TO_REFILL_ENERGY: i64 = 30;
const MAX_ENERGY: u64 = 5;

#[program]
pub mod lumberjack {
    use super::*;

    pub fn init_player(ctx: Context<InitPlayer>) -> Result<()> {
        ctx.accounts.player.energy = MAX_ENERGY;
        ctx.accounts.player.last_login = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn chop_tree(mut ctx: Context<ChopTree>) -> Result<()> {
        let account = &mut ctx.accounts;
        update_energy(account)?;

        if ctx.accounts.player.energy == 0 {
            return err!(ErrorCode::NotEnoughEnergy);
        }

        ctx.accounts.player.wood = ctx.accounts.player.wood + 1;
        ctx.accounts.player.energy = ctx.accounts.player.energy - 1;
        msg!(
            "You chopped a tree and got 1 wood. You have {} wood and {} energy left.",
            ctx.accounts.player.wood,
            ctx.accounts.player.energy
        );
        Ok(())
    }

    pub fn update(mut ctx: Context<ChopTree>) -> Result<()> {
        let account = &mut ctx.accounts;
        update_energy(account)?;
        msg!(
            "Updated energy. You have {} wood and {} energy left.",
            ctx.accounts.player.wood,
            ctx.accounts.player.energy
        );
        Ok(())
    }
}

pub fn update_energy(ctx: &mut ChopTree) -> Result<()> {
    let mut time_passed: i64 = &Clock::get()?.unix_timestamp - &ctx.player.last_login;
    let mut time_spent: i64 = 0;
    msg!("Time passed: {}", time_passed);
    while time_passed > TIME_TO_REFILL_ENERGY {
        ctx.player.energy = ctx.player.energy + 1;
        time_passed -= TIME_TO_REFILL_ENERGY;
        time_spent += TIME_TO_REFILL_ENERGY;
        if ctx.player.energy == MAX_ENERGY {
            break;
        }
    }

    if ctx.player.energy >= MAX_ENERGY {
        ctx.player.last_login = Clock::get()?.unix_timestamp;
    } else {
        ctx.player.last_login += time_spent;
    }

    Ok(())
}

#[derive(Accounts)]
pub struct InitPlayer<'info> {
    #[account( 
        init, 
        payer = signer,
        space = 1000,
        seeds = [b"player".as_ref(), signer.key().as_ref()],
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

#[derive(Accounts)]
pub struct ChopTree<'info> {
    #[account( 
        mut,
        seeds = [b"player".as_ref(), signer.key().as_ref()],
        bump,
    )]
    pub player: Account<'info, PlayerData>,
    #[account(mut)]
    pub signer: Signer<'info>,
}
