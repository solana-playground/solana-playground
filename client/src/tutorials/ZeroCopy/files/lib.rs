use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use std::str;

declare_id!("2MpQoKyLGXP26cGASC8pPLY3MaCGitM9XKUxziUmNN4i");

#[program]
pub mod zero_copy {

    use super::*;

    pub fn initialize_no_zero_copy(_ctx: Context<InitializeNoZeroCopy>) -> Result<()> {
        Ok(())
    }

    pub fn initialize_zero_copy(_ctx: Context<InitializeZeroCopy>) -> Result<()> {
        Ok(())
    }

    pub fn initialize_hit_stack_size(_ctx: Context<InitializeHitStackSize>) -> Result<()> {
        Ok(())
    }

    pub fn set_data(ctx: Context<SetData>, string_to_set: String, index: u64) -> Result<()> {
        let text_to_add_to_the_account = str::from_utf8(string_to_set.as_bytes()).unwrap();
        msg!(text_to_add_to_the_account);

        // Since the account is bigger that the heap space as soon as we access the whole account we will get a out of memory error
        // let string = &ctx.accounts.data_holder.load_mut()?.long_string;
        // let complete_string = str::from_utf8(string).unwrap();
        // msg!("DataLength: {}", string.len());
        // msg!("CompleteString: {}", complete_string);

        // So the solution is use copy_from_slice and mem copy when we want to access data in the big account
        ctx.accounts.data_holder.load_mut()?.long_string
            [((index) as usize)..((index + 912) as usize)]
            .copy_from_slice(string_to_set.as_bytes());

        Ok(())
    }

    pub fn increase_account_data_zero_copy(
        _ctx: Context<IncreaseZeroCopy>,
        _len: u16,
    ) -> Result<()> {
        Ok(())
    }

    pub fn increase_account_data(_ctx: Context<IncreaseAccoutSize>, _len: u16) -> Result<()> {
        Ok(())
    }

    pub fn set_data_no_zero_copy(
        ctx: Context<SetDataNoZeroCopy>,
        string_to_set: String,
    ) -> Result<()> {
        // This will work up to the limit of heap space
        ctx.accounts
            .data_holder
            .greet_string
            .push_str(&string_to_set);
        //msg!(&ctx.accounts.data_holder.greet_string.len().to_string());
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeZeroCopy<'info> {
    #[account(init, 
        seeds = [b"data_holder_zero_copy_v0", 
        signer.key().as_ref()], 
        bump, 
        payer=signer, 
        space= 10 * 1024 as usize)]
    pub data_holder: AccountLoader<'info, DataHolder>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeNoZeroCopy<'info> {
    #[account(init,
        seeds = [b"data_holder_no_zero_copy_v0", 
        signer.key().as_ref()], 
        bump, 
        payer=signer, 
        space= 10 * 1024 as usize)]
    pub data_holder_no_zero_copy: Account<'info, DataHolderNoZeroCopy>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetData<'info> {
    #[account(mut)]
    pub data_holder: AccountLoader<'info, DataHolder>,
    #[account(mut)]
    pub signer: Signer<'info>,
}

//#[account(zero_copy)] // For Anchor 0.26.0 and before. 
// See Change log: https://github.com/coral-xyz/anchor/blob/master/CHANGELOG.md
#[account(zero_copy(unsafe))]
#[repr(C)]
pub struct DataHolder {
    // 40952 = 40960 - 8 (account desciminator)
    pub long_string: [u8; 40952],
}

#[derive(Accounts)]
#[instruction(len: u16)]
pub struct IncreaseZeroCopy<'info> {
    #[account(mut, 
        realloc = len as usize, 
        realloc::zero = true, 
        realloc::payer=signer)]
    pub data_holder: AccountLoader<'info, DataHolder>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetDataNoZeroCopy<'info> {
    #[account(mut)]
    pub data_holder: Account<'info, DataHolderNoZeroCopy>,
    #[account(mut)]
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(len: u16)]
pub struct IncreaseAccoutSize<'info> {
    #[account(mut, 
        realloc = len as usize, 
        realloc::zero = true, 
        realloc::payer=signer)]
    pub data_holder: Account<'info, DataHolderNoZeroCopy>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct DataHolderNoZeroCopy {
    pub greet_string: String,
}

#[derive(Accounts)]
pub struct InitializeHitStackSize<'info> {
    #[account(init, 
        seeds = [b"hit_stack_size", signer.key().as_ref()], 
        bump, 
        payer=signer, 
        space= 10 * 1024 as usize)]
    //pub data_holder: Box<Account<'info, HitStackSize>>,
    pub data_holder: Account<'info, HitStackSize>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
// 10 * (128 + 1) = 1290 bytes -> With the way anchor deserialized the account in the init function this will already hit the stack limit
// Error  will be: Stack offset of 4400 exceeded max offset of 4096 by 304 bytes.
// If you box the account int the InitilizeHitStackSize account struct.
pub struct HitStackSize {
    board: [Option<BigStruct>; 12],
}

#[derive(AnchorSerialize, AnchorDeserialize, Copy, Clone, PartialEq, Eq)]
// Size of this struct is 32 bytes * 4 = 128 bytes
pub struct BigStruct {
    pub public_key_1: Pubkey,
    pub public_key_2: Pubkey,
    pub public_key_3: Pubkey,
    pub public_key_4: Pubkey,
}
