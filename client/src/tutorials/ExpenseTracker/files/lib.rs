use anchor_lang::prelude::*;
use anchor_lang::solana_program::{self,system_program, sysvar::rent::Rent,};

// declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");
declare_id!("Dt1Cu5jz7UMzLFgXPNyYcP8jCcySYgLW5QXpubjKvvm3");



#[program]
pub mod etracker {

    use super::*;

    pub fn initialize_expense(ctx: Context<InitializeExpense>,id : String,mname : String,amount : u64) -> Result<()> {
        
        let expense_account = &mut ctx.accounts.expense_account;
        let integer_id = id.parse::<u64>().unwrap();
        let string_id = integer_id.to_string();

        require_eq!(string_id, id);

        expense_account.id = integer_id;
        expense_account.mname = mname;
        expense_account.amount = amount;
        expense_account.owner = *ctx.accounts.authority.key;
        expense_account.bump = *ctx.bumps.get("expense_account").unwrap();

        Ok(())
    }

    
    pub fn modify_expense(ctx: Context<ModifyExpense>,id : String,mname : String,amount : u64) -> Result<()> {
        
        let expense_account = &mut ctx.accounts.expense_account;
        expense_account.mname = mname;
        expense_account.amount = amount;

        Ok(())
    }

    pub fn delete_expense(ctx: Context<DeleteExpense>,id : String) -> Result<()> {

        Ok(())
    }


}

#[derive(Accounts)]
#[instruction(id : String)]
pub struct InitializeExpense<'info> {

    #[account(
        mut,
    )]
    pub authority: Signer<'info>,


    #[account(
        init,
        payer = authority,
        space = 8 
            + 8 // id
            + 32 // owner
            + (4 + 12) // merchant name
            + 8 // amount
            + 1, // bump
        seeds = [b"expense".as_ref(),authority.key().as_ref(),id.as_ref()], 
        bump
    )]
    pub expense_account: Account<'info, ExpenseAccount>,

    // Misc Accounts
    #[account(address = system_program::ID)]
    pub system_program: Program<'info,System>,
    #[account(address = solana_program::sysvar::rent::ID)]
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(id : String)]
pub struct ModifyExpense<'info> {

    #[account(
        mut,
    )]
    pub authority: Signer<'info>,


    #[account(
        mut,
        seeds = [b"expense".as_ref(),authority.key().as_ref(),id.as_ref()], 
        bump=expense_account.bump
    )]
    pub expense_account: Account<'info, ExpenseAccount>,

    // Misc Accounts
    #[account(address = system_program::ID)]
    pub system_program: Program<'info,System>,
    #[account(address = solana_program::sysvar::rent::ID)]
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(id : String)]
pub struct DeleteExpense<'info> {

    #[account(
        mut,
    )]
    pub authority: Signer<'info>,


    #[account(
        mut,
        close = authority,
        seeds = [b"expense".as_ref(),authority.key().as_ref(),id.as_ref()], 
        bump=expense_account.bump
    )]
    pub expense_account: Account<'info, ExpenseAccount>,

    // Misc Accounts
    #[account(address = system_program::ID)]
    pub system_program: Program<'info,System>,
    #[account(address = solana_program::sysvar::rent::ID)]
    pub rent: Sysvar<'info, Rent>,
}


#[account]
#[derive(Default)]
pub struct ExpenseAccount {
    pub id: u64,
    pub owner: Pubkey,
    pub mname: String,
    pub amount: u64,
    pub bump: u8,
}