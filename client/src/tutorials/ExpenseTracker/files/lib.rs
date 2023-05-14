use anchor_lang::prelude::*;
use anchor_lang::solana_program::{self, system_program, sysvar::rent::Rent};

declare_id!("Dt1Cu5jz7UMzLFgXPNyYcP8jCcySYgLW5QXpubjKvvm3");

#[program]
pub mod etracker {

    use super::*;

    pub fn initialize_expense(
        ctx: Context<InitializeExpense>,
        id: String,
        merchant_name: String,
        amount: u64,
    ) -> Result<()> {
        let expense_account = &mut ctx.accounts.expense_account;
        let integer_id = id.parse::<u64>().unwrap();
        let string_id = integer_id.to_string();

        require_eq!(string_id, id);

        expense_account.id = integer_id;
        expense_account.merchant_name = merchant_name;
        expense_account.amount = amount;
        expense_account.owner = *ctx.accounts.authority.key;

        Ok(())
    }

    pub fn modify_expense(
        ctx: Context<ModifyExpense>,
        id: String,
        merchant_name: String,
        amount: u64,
    ) -> Result<()> {
        let expense_account = &mut ctx.accounts.expense_account;
        expense_account.merchant_name = merchant_name;
        expense_account.amount = amount;

        Ok(())
    }

    pub fn delete_expense(ctx: Context<DeleteExpense>, id: String) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(id : String)]
pub struct InitializeExpense<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + 8 + 32+ (4 + 12)+ 8 + 1,
        seeds = [b"expense", authority.key().as_ref(), id.as_ref()], 
        bump
    )]
    pub expense_account: Account<'info, ExpenseAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(id : String)]
pub struct ModifyExpense<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"expense", authority.key().as_ref(), id.as_ref()], 
        bump
    )]
    pub expense_account: Account<'info, ExpenseAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(id : String)]
pub struct DeleteExpense<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        close = authority,
        seeds = [b"expense", authority.key().as_ref(), id.as_ref()], 
        bump
    )]
    pub expense_account: Account<'info, ExpenseAccount>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(Default)]
pub struct ExpenseAccount {
    pub id: u64,
    pub owner: Pubkey,
    pub merchant_name: String,
    pub amount: u64,
}
