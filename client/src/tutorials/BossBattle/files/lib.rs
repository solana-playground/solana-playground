use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

const MAX_HEALTH: u64 = 1000;
const MAX_DAMAGE: u64 = 500;

#[program]
pub mod boss_battle {
    use super::*;

    pub fn respawn(ctx: Context<Respawn>) -> Result<()> {
        // Reset enemy boss to max health
        ctx.accounts.enemy_boss.health = MAX_HEALTH;
        Ok(())
    }

    pub fn attack(ctx: Context<Attack>) -> Result<()> {
        // Check if enemy boss has enough health
        if ctx.accounts.enemy_boss.health == 0 {
            return err!(ErrorCode::NotEnoughHealth);
        }

        // Get current slot
        let slot = Clock::get()?.slot;
        // Generate pseudo-random number using XORShift with the current slot as seed
        let xorshift_output = xorshift64(slot);
        // Calculate random damage
        let random_damage = xorshift_output % (MAX_DAMAGE);
        msg!("Random Damage: {}", random_damage);

        // Subtract health from enemy boss, min health is 0
        ctx.accounts.enemy_boss.health =
            ctx.accounts.enemy_boss.health.saturating_sub(random_damage);
        msg!("Enemy Boss Health: {}", ctx.accounts.enemy_boss.health);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Respawn<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        init_if_needed,
        payer = player,
        space = 8 + 8,
        seeds = [b"boss"],
        bump,
    )]
    pub enemy_boss: Account<'info, EnemyBoss>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Attack<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        mut,
        seeds = [b"boss"],
        bump,
    )]
    pub enemy_boss: Account<'info, EnemyBoss>,
}

#[account]
pub struct EnemyBoss {
    pub health: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Boss at 0 health; respawn to attack.")]
    NotEnoughHealth,
}

pub fn xorshift64(seed: u64) -> u64 {
    let mut x = seed;
    x ^= x << 13;
    x ^= x >> 7;
    x ^= x << 17;
    x
}
