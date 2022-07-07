//! Program state processor

use {
    crate::program::spl_token_2022::{
        amount_to_ui_amount_string_trimmed, check_program_account, cmp_pubkeys,
        error::TokenError,
        extension::{
            // TODO:
            // confidential_transfer::{self, ConfidentialTransferAccount},
            default_account_state::{self, DefaultAccountState},
            immutable_owner::ImmutableOwner,
            interest_bearing_mint::{self, InterestBearingConfig},
            memo_transfer::{self, check_previous_sibling_instruction_is_memo, memo_required},
            mint_close_authority::MintCloseAuthority,
            non_transferable::NonTransferable,
            reallocate,
            transfer_fee::{self, TransferFeeAmount, TransferFeeConfig},
            ExtensionType,
            StateWithExtensions,
            StateWithExtensionsMut,
        },
        instruction::{is_valid_signer_index, AuthorityType, TokenInstruction, MAX_SIGNERS},
        native_mint,
        state::{Account, AccountState, Mint, Multisig},
        try_ui_amount_into_amount,
    },
    num_traits::FromPrimitive,
    solana_sdk::{
        account_info::{next_account_info, AccountInfo},
        clock::Clock,
        decode_error::DecodeError,
        entrypoint::ProgramResult,
        msg,
        program::{invoke, invoke_signed, set_return_data},
        program_error::{PrintProgramError, ProgramError},
        program_memory::sol_memset,
        program_option::COption,
        program_pack::Pack,
        pubkey::Pubkey,
        system_instruction,
        sysvar::{rent::Rent, Sysvar},
    },
    std::convert::{TryFrom, TryInto},
};

/// Program state handler.
pub struct Processor {}
impl Processor {
    fn _process_initialize_mint(
        accounts: &[AccountInfo],
        decimals: u8,
        mint_authority: Pubkey,
        freeze_authority: COption<Pubkey>,
        rent_sysvar_account: bool,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let mint_info = next_account_info(account_info_iter)?;
        let mint_data_len = mint_info.data_len();
        let mut mint_data = mint_info.data.borrow_mut();
        let rent = if rent_sysvar_account {
            Rent::from_account_info(next_account_info(account_info_iter)?)?
        } else {
            Rent::get()?
        };

        if !rent.is_exempt(mint_info.lamports(), mint_data_len) {
            return Err(TokenError::NotRentExempt.into());
        }

        let mut mint = StateWithExtensionsMut::<Mint>::unpack_uninitialized(&mut mint_data)?;
        if mint.base.is_initialized {
            return Err(TokenError::AlreadyInUse.into());
        }

        let extension_types = mint.get_extension_types()?;
        if ExtensionType::get_account_len::<Mint>(&extension_types) != mint_data_len {
            return Err(ProgramError::InvalidAccountData);
        }

        if let Ok(default_account_state) = mint.get_extension_mut::<DefaultAccountState>() {
            let default_account_state = AccountState::try_from(default_account_state.state)
                .or(Err(ProgramError::InvalidAccountData))?;
            if default_account_state == AccountState::Frozen && freeze_authority.is_none() {
                return Err(TokenError::MintCannotFreeze.into());
            }
        }

        mint.base.mint_authority = COption::Some(mint_authority);
        mint.base.decimals = decimals;
        mint.base.is_initialized = true;
        mint.base.freeze_authority = freeze_authority;
        mint.pack_base();
        mint.init_account_type()?;

        Ok(())
    }

    /// Processes an [InitializeMint](enum.TokenInstruction.html) instruction.
    pub fn process_initialize_mint(
        accounts: &[AccountInfo],
        decimals: u8,
        mint_authority: Pubkey,
        freeze_authority: COption<Pubkey>,
    ) -> ProgramResult {
        Self::_process_initialize_mint(accounts, decimals, mint_authority, freeze_authority, true)
    }

    /// Processes an [InitializeMint2](enum.TokenInstruction.html) instruction.
    pub fn process_initialize_mint2(
        accounts: &[AccountInfo],
        decimals: u8,
        mint_authority: Pubkey,
        freeze_authority: COption<Pubkey>,
    ) -> ProgramResult {
        Self::_process_initialize_mint(accounts, decimals, mint_authority, freeze_authority, false)
    }

    fn _process_initialize_account(
        accounts: &[AccountInfo],
        owner: Option<&Pubkey>,
        rent_sysvar_account: bool,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let new_account_info = next_account_info(account_info_iter)?;
        let mint_info = next_account_info(account_info_iter)?;
        let owner = if let Some(owner) = owner {
            owner
        } else {
            next_account_info(account_info_iter)?.key
        };
        let new_account_info_data_len = new_account_info.data_len();
        let rent = if rent_sysvar_account {
            Rent::from_account_info(next_account_info(account_info_iter)?)?
        } else {
            Rent::get()?
        };

        let mut account_data = new_account_info.data.borrow_mut();
        // unpack_uninitialized checks account.base.is_initialized() under the hood
        let mut account =
            StateWithExtensionsMut::<Account>::unpack_uninitialized(&mut account_data)?;

        if !rent.is_exempt(new_account_info.lamports(), new_account_info_data_len) {
            return Err(TokenError::NotRentExempt.into());
        }

        // get_required_account_extensions checks mint validity
        let mint_data = mint_info.data.borrow();
        let mint = StateWithExtensions::<Mint>::unpack(&mint_data)
            .map_err(|_| Into::<ProgramError>::into(TokenError::InvalidMint))?;
        let required_extensions =
            Self::get_required_account_extensions_from_unpacked_mint(mint_info.owner, &mint)?;
        if ExtensionType::get_account_len::<Account>(&required_extensions)
            > new_account_info_data_len
        {
            return Err(ProgramError::InvalidAccountData);
        }
        for extension in required_extensions {
            account.init_account_extension_from_type(extension)?;
        }

        let starting_state =
            if let Ok(default_account_state) = mint.get_extension::<DefaultAccountState>() {
                AccountState::try_from(default_account_state.state)
                    .or(Err(ProgramError::InvalidAccountData))?
            } else {
                AccountState::Initialized
            };

        account.base.mint = *mint_info.key;
        account.base.owner = *owner;
        account.base.close_authority = COption::None;
        account.base.delegate = COption::None;
        account.base.delegated_amount = 0;
        account.base.state = starting_state;
        if cmp_pubkeys(mint_info.key, &native_mint::id()) {
            let rent_exempt_reserve = rent.minimum_balance(new_account_info_data_len);
            account.base.is_native = COption::Some(rent_exempt_reserve);
            account.base.amount = new_account_info
                .lamports()
                .checked_sub(rent_exempt_reserve)
                .ok_or(TokenError::Overflow)?;
        } else {
            account.base.is_native = COption::None;
            account.base.amount = 0;
        };

        account.pack_base();
        account.init_account_type()?;

        Ok(())
    }

    /// Processes an [InitializeAccount](enum.TokenInstruction.html) instruction.
    pub fn process_initialize_account(accounts: &[AccountInfo]) -> ProgramResult {
        Self::_process_initialize_account(accounts, None, true)
    }

    /// Processes an [InitializeAccount2](enum.TokenInstruction.html) instruction.
    pub fn process_initialize_account2(accounts: &[AccountInfo], owner: Pubkey) -> ProgramResult {
        Self::_process_initialize_account(accounts, Some(&owner), true)
    }

    /// Processes an [InitializeAccount3](enum.TokenInstruction.html) instruction.
    pub fn process_initialize_account3(accounts: &[AccountInfo], owner: Pubkey) -> ProgramResult {
        Self::_process_initialize_account(accounts, Some(&owner), false)
    }

    fn _process_initialize_multisig(
        accounts: &[AccountInfo],
        m: u8,
        rent_sysvar_account: bool,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let multisig_info = next_account_info(account_info_iter)?;
        let multisig_info_data_len = multisig_info.data_len();
        let rent = if rent_sysvar_account {
            Rent::from_account_info(next_account_info(account_info_iter)?)?
        } else {
            Rent::get()?
        };

        let mut multisig = Multisig::unpack_unchecked(&multisig_info.data.borrow())?;
        if multisig.is_initialized {
            return Err(TokenError::AlreadyInUse.into());
        }

        if !rent.is_exempt(multisig_info.lamports(), multisig_info_data_len) {
            return Err(TokenError::NotRentExempt.into());
        }

        let signer_infos = account_info_iter.as_slice();
        multisig.m = m;
        multisig.n = signer_infos.len() as u8;
        if !is_valid_signer_index(multisig.n as usize) {
            return Err(TokenError::InvalidNumberOfProvidedSigners.into());
        }
        if !is_valid_signer_index(multisig.m as usize) {
            return Err(TokenError::InvalidNumberOfRequiredSigners.into());
        }
        for (i, signer_info) in signer_infos.iter().enumerate() {
            multisig.signers[i] = *signer_info.key;
        }
        multisig.is_initialized = true;

        Multisig::pack(multisig, &mut multisig_info.data.borrow_mut())?;

        Ok(())
    }

    /// Processes a [InitializeMultisig](enum.TokenInstruction.html) instruction.
    pub fn process_initialize_multisig(accounts: &[AccountInfo], m: u8) -> ProgramResult {
        Self::_process_initialize_multisig(accounts, m, true)
    }

    /// Processes a [InitializeMultisig2](enum.TokenInstruction.html) instruction.
    pub fn process_initialize_multisig2(accounts: &[AccountInfo], m: u8) -> ProgramResult {
        Self::_process_initialize_multisig(accounts, m, false)
    }

    /// Processes a [Transfer](enum.TokenInstruction.html) instruction.
    pub fn process_transfer(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        amount: u64,
        expected_decimals: Option<u8>,
        expected_fee: Option<u64>,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();

        let source_account_info = next_account_info(account_info_iter)?;

        let expected_mint_info = if let Some(expected_decimals) = expected_decimals {
            Some((next_account_info(account_info_iter)?, expected_decimals))
        } else {
            None
        };

        let destination_account_info = next_account_info(account_info_iter)?;
        let authority_info = next_account_info(account_info_iter)?;
        let authority_info_data_len = authority_info.data_len();

        let mut source_account_data = source_account_info.data.borrow_mut();
        let mut source_account =
            StateWithExtensionsMut::<Account>::unpack(&mut source_account_data)?;
        if source_account.base.is_frozen() {
            return Err(TokenError::AccountFrozen.into());
        }
        if source_account.base.amount < amount {
            return Err(TokenError::InsufficientFunds.into());
        }
        let fee = if let Some((mint_info, expected_decimals)) = expected_mint_info {
            if !cmp_pubkeys(&source_account.base.mint, mint_info.key) {
                return Err(TokenError::MintMismatch.into());
            }

            let mint_data = mint_info.try_borrow_data()?;
            let mint = StateWithExtensions::<Mint>::unpack(&mint_data)?;

            if mint.get_extension::<NonTransferable>().is_ok() {
                return Err(TokenError::NonTransferable.into());
            }

            if expected_decimals != mint.base.decimals {
                return Err(TokenError::MintDecimalsMismatch.into());
            }

            if let Ok(transfer_fee_config) = mint.get_extension::<TransferFeeConfig>() {
                transfer_fee_config
                    .calculate_epoch_fee(Clock::get()?.epoch, amount)
                    .ok_or(TokenError::Overflow)?
            } else {
                0
            }
        } else {
            // Transfer fee amount extension exists on the account, but no mint
            // was provided to calculate the fee, abort
            if source_account
                .get_extension_mut::<TransferFeeAmount>()
                .is_ok()
            {
                return Err(TokenError::MintRequiredForTransfer.into());
            } else {
                0
            }
        };
        if let Some(expected_fee) = expected_fee {
            if expected_fee != fee {
                msg!("Calculated fee {}, received {}", fee, expected_fee);
                return Err(TokenError::FeeMismatch.into());
            }
        }

        let self_transfer = cmp_pubkeys(source_account_info.key, destination_account_info.key);
        match source_account.base.delegate {
            COption::Some(ref delegate) if cmp_pubkeys(authority_info.key, delegate) => {
                Self::validate_owner(
                    program_id,
                    delegate,
                    authority_info,
                    authority_info_data_len,
                    account_info_iter.as_slice(),
                )?;
                if source_account.base.delegated_amount < amount {
                    return Err(TokenError::InsufficientFunds.into());
                }
                if !self_transfer {
                    source_account.base.delegated_amount = source_account
                        .base
                        .delegated_amount
                        .checked_sub(amount)
                        .ok_or(TokenError::Overflow)?;
                    if source_account.base.delegated_amount == 0 {
                        source_account.base.delegate = COption::None;
                    }
                }
            }
            _ => Self::validate_owner(
                program_id,
                &source_account.base.owner,
                authority_info,
                authority_info_data_len,
                account_info_iter.as_slice(),
            )?,
        };

        // Revisit this later to see if it's worth adding a check to reduce
        // compute costs, ie:
        // if self_transfer || amount == 0
        check_program_account(source_account_info.owner)?;
        check_program_account(destination_account_info.owner)?;

        // This check MUST occur just before the amounts are manipulated
        // to ensure self-transfers are fully validated
        if self_transfer {
            return Ok(());
        }

        // self-transfer was dealt with earlier, so this *should* be safe
        let mut destination_account_data = destination_account_info.data.borrow_mut();
        let mut destination_account =
            StateWithExtensionsMut::<Account>::unpack(&mut destination_account_data)?;

        if destination_account.base.is_frozen() {
            return Err(TokenError::AccountFrozen.into());
        }
        if !cmp_pubkeys(&source_account.base.mint, &destination_account.base.mint) {
            return Err(TokenError::MintMismatch.into());
        }

        if memo_required(&destination_account) {
            check_previous_sibling_instruction_is_memo()?;
        }

        source_account.base.amount = source_account
            .base
            .amount
            .checked_sub(amount)
            .ok_or(TokenError::Overflow)?;
        let credited_amount = amount.checked_sub(fee).ok_or(TokenError::Overflow)?;
        destination_account.base.amount = destination_account
            .base
            .amount
            .checked_add(credited_amount)
            .ok_or(TokenError::Overflow)?;
        if fee > 0 {
            if let Ok(extension) = destination_account.get_extension_mut::<TransferFeeAmount>() {
                let new_withheld_amount = u64::from(extension.withheld_amount)
                    .checked_add(fee)
                    .ok_or(TokenError::Overflow)?;
                extension.withheld_amount = new_withheld_amount.into();
            } else {
                // Use the generic error since this should never happen. If there's
                // a fee, then the mint has a fee configured, which means all accounts
                // must have the withholding.
                return Err(TokenError::InvalidState.into());
            }
        }

        if source_account.base.is_native() {
            let source_starting_lamports = source_account_info.lamports();
            **source_account_info.lamports.borrow_mut() = source_starting_lamports
                .checked_sub(amount)
                .ok_or(TokenError::Overflow)?;

            let destination_starting_lamports = destination_account_info.lamports();
            **destination_account_info.lamports.borrow_mut() = destination_starting_lamports
                .checked_add(amount)
                .ok_or(TokenError::Overflow)?;
        }

        source_account.pack_base();
        destination_account.pack_base();

        Ok(())
    }

    /// Processes an [Approve](enum.TokenInstruction.html) instruction.
    pub fn process_approve(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        amount: u64,
        expected_decimals: Option<u8>,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();

        let source_account_info = next_account_info(account_info_iter)?;

        let expected_mint_info = if let Some(expected_decimals) = expected_decimals {
            Some((next_account_info(account_info_iter)?, expected_decimals))
        } else {
            None
        };
        let delegate_info = next_account_info(account_info_iter)?;
        let owner_info = next_account_info(account_info_iter)?;
        let owner_info_data_len = owner_info.data_len();

        let mut source_account_data = source_account_info.data.borrow_mut();
        let mut source_account =
            StateWithExtensionsMut::<Account>::unpack(&mut source_account_data)?;

        if source_account.base.is_frozen() {
            return Err(TokenError::AccountFrozen.into());
        }

        if let Some((mint_info, expected_decimals)) = expected_mint_info {
            if !cmp_pubkeys(&source_account.base.mint, mint_info.key) {
                return Err(TokenError::MintMismatch.into());
            }

            let mint_data = mint_info.data.borrow();
            let mint = StateWithExtensions::<Mint>::unpack(&mint_data)?;
            if expected_decimals != mint.base.decimals {
                return Err(TokenError::MintDecimalsMismatch.into());
            }
        }

        Self::validate_owner(
            program_id,
            &source_account.base.owner,
            owner_info,
            owner_info_data_len,
            account_info_iter.as_slice(),
        )?;

        source_account.base.delegate = COption::Some(*delegate_info.key);
        source_account.base.delegated_amount = amount;
        source_account.pack_base();

        Ok(())
    }

    /// Processes an [Revoke](enum.TokenInstruction.html) instruction.
    pub fn process_revoke(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let source_account_info = next_account_info(account_info_iter)?;
        let authority_info = next_account_info(account_info_iter)?;
        let authority_info_data_len = authority_info.data_len();

        let mut source_account_data = source_account_info.data.borrow_mut();
        let mut source_account =
            StateWithExtensionsMut::<Account>::unpack(&mut source_account_data)?;
        if source_account.base.is_frozen() {
            return Err(TokenError::AccountFrozen.into());
        }

        Self::validate_owner(
            program_id,
            match source_account.base.delegate {
                COption::Some(ref delegate) if cmp_pubkeys(authority_info.key, delegate) => {
                    delegate
                }
                _ => &source_account.base.owner,
            },
            authority_info,
            authority_info_data_len,
            account_info_iter.as_slice(),
        )?;

        source_account.base.delegate = COption::None;
        source_account.base.delegated_amount = 0;
        source_account.pack_base();

        Ok(())
    }

    /// Processes a [SetAuthority](enum.TokenInstruction.html) instruction.
    pub fn process_set_authority(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        authority_type: AuthorityType,
        new_authority: COption<Pubkey>,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let account_info = next_account_info(account_info_iter)?;
        let authority_info = next_account_info(account_info_iter)?;
        let authority_info_data_len = authority_info.data_len();

        let mut account_data = account_info.data.borrow_mut();
        if let Ok(mut account) = StateWithExtensionsMut::<Account>::unpack(&mut account_data) {
            if account.base.is_frozen() {
                return Err(TokenError::AccountFrozen.into());
            }

            match authority_type {
                AuthorityType::AccountOwner => {
                    Self::validate_owner(
                        program_id,
                        &account.base.owner,
                        authority_info,
                        authority_info_data_len,
                        account_info_iter.as_slice(),
                    )?;

                    if account.get_extension_mut::<ImmutableOwner>().is_ok() {
                        return Err(TokenError::ImmutableOwner.into());
                    }

                    if let COption::Some(authority) = new_authority {
                        account.base.owner = authority;
                    } else {
                        return Err(TokenError::InvalidInstruction.into());
                    }

                    account.base.delegate = COption::None;
                    account.base.delegated_amount = 0;

                    if account.base.is_native() {
                        account.base.close_authority = COption::None;
                    }
                }
                AuthorityType::CloseAccount => {
                    let authority = account.base.close_authority.unwrap_or(account.base.owner);
                    Self::validate_owner(
                        program_id,
                        &authority,
                        authority_info,
                        authority_info_data_len,
                        account_info_iter.as_slice(),
                    )?;
                    account.base.close_authority = new_authority;
                }
                _ => {
                    return Err(TokenError::AuthorityTypeNotSupported.into());
                }
            }
            account.pack_base();
        } else if let Ok(mut mint) = StateWithExtensionsMut::<Mint>::unpack(&mut account_data) {
            match authority_type {
                AuthorityType::MintTokens => {
                    // Once a mint's supply is fixed, it cannot be undone by setting a new
                    // mint_authority
                    let mint_authority = mint
                        .base
                        .mint_authority
                        .ok_or(Into::<ProgramError>::into(TokenError::FixedSupply))?;
                    Self::validate_owner(
                        program_id,
                        &mint_authority,
                        authority_info,
                        authority_info_data_len,
                        account_info_iter.as_slice(),
                    )?;
                    mint.base.mint_authority = new_authority;
                    mint.pack_base();
                }
                AuthorityType::FreezeAccount => {
                    // Once a mint's freeze authority is disabled, it cannot be re-enabled by
                    // setting a new freeze_authority
                    let freeze_authority = mint
                        .base
                        .freeze_authority
                        .ok_or(Into::<ProgramError>::into(TokenError::MintCannotFreeze))?;
                    Self::validate_owner(
                        program_id,
                        &freeze_authority,
                        authority_info,
                        authority_info_data_len,
                        account_info_iter.as_slice(),
                    )?;
                    mint.base.freeze_authority = new_authority;
                    mint.pack_base();
                }
                AuthorityType::CloseMint => {
                    let extension = mint.get_extension_mut::<MintCloseAuthority>()?;
                    let maybe_close_authority: Option<Pubkey> = extension.close_authority.into();
                    let close_authority =
                        maybe_close_authority.ok_or(TokenError::AuthorityTypeNotSupported)?;
                    Self::validate_owner(
                        program_id,
                        &close_authority,
                        authority_info,
                        authority_info_data_len,
                        account_info_iter.as_slice(),
                    )?;
                    extension.close_authority = new_authority.try_into()?;
                }
                AuthorityType::TransferFeeConfig => {
                    let extension = mint.get_extension_mut::<TransferFeeConfig>()?;
                    let maybe_transfer_fee_config_authority: Option<Pubkey> =
                        extension.transfer_fee_config_authority.into();
                    let transfer_fee_config_authority = maybe_transfer_fee_config_authority
                        .ok_or(TokenError::AuthorityTypeNotSupported)?;
                    Self::validate_owner(
                        program_id,
                        &transfer_fee_config_authority,
                        authority_info,
                        authority_info_data_len,
                        account_info_iter.as_slice(),
                    )?;
                    extension.transfer_fee_config_authority = new_authority.try_into()?;
                }
                AuthorityType::WithheldWithdraw => {
                    let extension = mint.get_extension_mut::<TransferFeeConfig>()?;
                    let maybe_withdraw_withheld_authority: Option<Pubkey> =
                        extension.withdraw_withheld_authority.into();
                    let withdraw_withheld_authority = maybe_withdraw_withheld_authority
                        .ok_or(TokenError::AuthorityTypeNotSupported)?;
                    Self::validate_owner(
                        program_id,
                        &withdraw_withheld_authority,
                        authority_info,
                        authority_info_data_len,
                        account_info_iter.as_slice(),
                    )?;
                    extension.withdraw_withheld_authority = new_authority.try_into()?;
                }
                AuthorityType::InterestRate => {
                    let extension = mint.get_extension_mut::<InterestBearingConfig>()?;
                    let maybe_rate_authority: Option<Pubkey> = extension.rate_authority.into();
                    let rate_authority =
                        maybe_rate_authority.ok_or(TokenError::AuthorityTypeNotSupported)?;
                    Self::validate_owner(
                        program_id,
                        &rate_authority,
                        authority_info,
                        authority_info_data_len,
                        account_info_iter.as_slice(),
                    )?;
                    extension.rate_authority = new_authority.try_into()?;
                }
                _ => {
                    return Err(TokenError::AuthorityTypeNotSupported.into());
                }
            }
        } else {
            return Err(ProgramError::InvalidAccountData);
        }

        Ok(())
    }

    /// Processes a [MintTo](enum.TokenInstruction.html) instruction.
    pub fn process_mint_to(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        amount: u64,
        expected_decimals: Option<u8>,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let mint_info = next_account_info(account_info_iter)?;
        let destination_account_info = next_account_info(account_info_iter)?;
        let owner_info = next_account_info(account_info_iter)?;
        let owner_info_data_len = owner_info.data_len();

        let mut destination_account_data = destination_account_info.data.borrow_mut();
        let mut destination_account =
            StateWithExtensionsMut::<Account>::unpack(&mut destination_account_data)?;
        if destination_account.base.is_frozen() {
            return Err(TokenError::AccountFrozen.into());
        }

        if destination_account.base.is_native() {
            return Err(TokenError::NativeNotSupported.into());
        }
        if !cmp_pubkeys(mint_info.key, &destination_account.base.mint) {
            return Err(TokenError::MintMismatch.into());
        }

        let mut mint_data = mint_info.data.borrow_mut();
        let mut mint = StateWithExtensionsMut::<Mint>::unpack(&mut mint_data)?;

        // If the mint if non-transferable, only allow minting to accounts
        // with immutable ownership.
        if mint.get_extension::<NonTransferable>().is_ok()
            && destination_account
                .get_extension::<ImmutableOwner>()
                .is_err()
        {
            return Err(TokenError::NonTransferableNeedsImmutableOwnership.into());
        }

        if let Some(expected_decimals) = expected_decimals {
            if expected_decimals != mint.base.decimals {
                return Err(TokenError::MintDecimalsMismatch.into());
            }
        }

        match mint.base.mint_authority {
            COption::Some(mint_authority) => Self::validate_owner(
                program_id,
                &mint_authority,
                owner_info,
                owner_info_data_len,
                account_info_iter.as_slice(),
            )?,
            COption::None => return Err(TokenError::FixedSupply.into()),
        }

        // Revisit this later to see if it's worth adding a check to reduce
        // compute costs, ie:
        // if amount == 0
        check_program_account(mint_info.owner)?;
        check_program_account(destination_account_info.owner)?;

        destination_account.base.amount = destination_account
            .base
            .amount
            .checked_add(amount)
            .ok_or(TokenError::Overflow)?;

        mint.base.supply = mint
            .base
            .supply
            .checked_add(amount)
            .ok_or(TokenError::Overflow)?;

        mint.pack_base();
        destination_account.pack_base();

        Ok(())
    }

    /// Processes a [Burn](enum.TokenInstruction.html) instruction.
    pub fn process_burn(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        amount: u64,
        expected_decimals: Option<u8>,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();

        let source_account_info = next_account_info(account_info_iter)?;
        let mint_info = next_account_info(account_info_iter)?;
        let authority_info = next_account_info(account_info_iter)?;
        let authority_info_data_len = authority_info.data_len();

        let mut source_account_data = source_account_info.data.borrow_mut();
        let mut source_account =
            StateWithExtensionsMut::<Account>::unpack(&mut source_account_data)?;
        let mut mint_data = mint_info.data.borrow_mut();
        let mut mint = StateWithExtensionsMut::<Mint>::unpack(&mut mint_data)?;

        if source_account.base.is_frozen() {
            return Err(TokenError::AccountFrozen.into());
        }
        if source_account.base.is_native() {
            return Err(TokenError::NativeNotSupported.into());
        }
        if source_account.base.amount < amount {
            return Err(TokenError::InsufficientFunds.into());
        }
        if mint_info.key != &source_account.base.mint {
            return Err(TokenError::MintMismatch.into());
        }

        if let Some(expected_decimals) = expected_decimals {
            if expected_decimals != mint.base.decimals {
                return Err(TokenError::MintDecimalsMismatch.into());
            }
        }

        if !source_account
            .base
            .is_owned_by_system_program_or_incinerator()
        {
            match source_account.base.delegate {
                COption::Some(ref delegate) if cmp_pubkeys(authority_info.key, delegate) => {
                    Self::validate_owner(
                        program_id,
                        delegate,
                        authority_info,
                        authority_info_data_len,
                        account_info_iter.as_slice(),
                    )?;

                    if source_account.base.delegated_amount < amount {
                        return Err(TokenError::InsufficientFunds.into());
                    }
                    source_account.base.delegated_amount = source_account
                        .base
                        .delegated_amount
                        .checked_sub(amount)
                        .ok_or(TokenError::Overflow)?;
                    if source_account.base.delegated_amount == 0 {
                        source_account.base.delegate = COption::None;
                    }
                }
                _ => Self::validate_owner(
                    program_id,
                    &source_account.base.owner,
                    authority_info,
                    authority_info_data_len,
                    account_info_iter.as_slice(),
                )?,
            }
        }

        // Revisit this later to see if it's worth adding a check to reduce
        // compute costs, ie:
        // if amount == 0
        check_program_account(source_account_info.owner)?;
        check_program_account(mint_info.owner)?;

        source_account.base.amount = source_account
            .base
            .amount
            .checked_sub(amount)
            .ok_or(TokenError::Overflow)?;
        mint.base.supply = mint
            .base
            .supply
            .checked_sub(amount)
            .ok_or(TokenError::Overflow)?;

        source_account.pack_base();
        mint.pack_base();

        Ok(())
    }

    /// Processes a [CloseAccount](enum.TokenInstruction.html) instruction.
    pub fn process_close_account(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let source_account_info = next_account_info(account_info_iter)?;
        let destination_account_info = next_account_info(account_info_iter)?;
        let authority_info = next_account_info(account_info_iter)?;
        let authority_info_data_len = authority_info.data_len();

        if cmp_pubkeys(source_account_info.key, destination_account_info.key) {
            return Err(ProgramError::InvalidAccountData);
        }

        let mut source_account_data = source_account_info.data.borrow_mut();
        if let Ok(source_account) = StateWithExtensions::<Account>::unpack(&source_account_data) {
            if !source_account.base.is_native() && source_account.base.amount != 0 {
                return Err(TokenError::NonNativeHasBalance.into());
            }

            let authority = source_account
                .base
                .close_authority
                .unwrap_or(source_account.base.owner);

            if !source_account
                .base
                .is_owned_by_system_program_or_incinerator()
            {
                Self::validate_owner(
                    program_id,
                    &authority,
                    authority_info,
                    authority_info_data_len,
                    account_info_iter.as_slice(),
                )?;
            } else if !solana_sdk::incinerator::check_id(destination_account_info.key) {
                return Err(ProgramError::InvalidAccountData);
            }

            // TODO:
            // if let Ok(confidential_transfer_state) =
            //     source_account.get_extension::<ConfidentialTransferAccount>()
            // {
            //     confidential_transfer_state.closable()?
            // }

            if let Ok(transfer_fee_state) = source_account.get_extension::<TransferFeeAmount>() {
                transfer_fee_state.closable()?
            }
        } else if let Ok(mint) = StateWithExtensions::<Mint>::unpack(&source_account_data) {
            let extension = mint.get_extension::<MintCloseAuthority>()?;
            let maybe_authority: Option<Pubkey> = extension.close_authority.into();
            let authority = maybe_authority.ok_or(TokenError::AuthorityTypeNotSupported)?;
            Self::validate_owner(
                program_id,
                &authority,
                authority_info,
                authority_info_data_len,
                account_info_iter.as_slice(),
            )?;

            if mint.base.supply != 0 {
                return Err(TokenError::MintHasSupply.into());
            }
        } else {
            return Err(ProgramError::UninitializedAccount);
        }

        let destination_starting_lamports = destination_account_info.lamports();
        **destination_account_info.lamports.borrow_mut() = destination_starting_lamports
            .checked_add(source_account_info.lamports())
            .ok_or(TokenError::Overflow)?;

        **source_account_info.lamports.borrow_mut() = 0;
        let data_len = source_account_data.len();
        sol_memset(*source_account_data, 0, data_len);

        Ok(())
    }

    /// Processes a [FreezeAccount](enum.TokenInstruction.html) or a
    /// [ThawAccount](enum.TokenInstruction.html) instruction.
    pub fn process_toggle_freeze_account(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        freeze: bool,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let source_account_info = next_account_info(account_info_iter)?;
        let mint_info = next_account_info(account_info_iter)?;
        let authority_info = next_account_info(account_info_iter)?;
        let authority_info_data_len = authority_info.data_len();

        let mut source_account_data = source_account_info.data.borrow_mut();
        let mut source_account =
            StateWithExtensionsMut::<Account>::unpack(&mut source_account_data)?;
        if freeze && source_account.base.is_frozen() || !freeze && !source_account.base.is_frozen()
        {
            return Err(TokenError::InvalidState.into());
        }
        if source_account.base.is_native() {
            return Err(TokenError::NativeNotSupported.into());
        }
        if !cmp_pubkeys(mint_info.key, &source_account.base.mint) {
            return Err(TokenError::MintMismatch.into());
        }

        let mint_data = mint_info.data.borrow();
        let mint = StateWithExtensions::<Mint>::unpack(&mint_data)?;
        match mint.base.freeze_authority {
            COption::Some(authority) => Self::validate_owner(
                program_id,
                &authority,
                authority_info,
                authority_info_data_len,
                account_info_iter.as_slice(),
            ),
            COption::None => Err(TokenError::MintCannotFreeze.into()),
        }?;

        source_account.base.state = if freeze {
            AccountState::Frozen
        } else {
            AccountState::Initialized
        };

        source_account.pack_base();

        Ok(())
    }

    /// Processes a [SyncNative](enum.TokenInstruction.html) instruction
    pub fn process_sync_native(accounts: &[AccountInfo]) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let native_account_info = next_account_info(account_info_iter)?;

        check_program_account(native_account_info.owner)?;
        let mut native_account_data = native_account_info.data.borrow_mut();
        let mut native_account =
            StateWithExtensionsMut::<Account>::unpack(&mut native_account_data)?;

        if let COption::Some(rent_exempt_reserve) = native_account.base.is_native {
            let new_amount = native_account_info
                .lamports()
                .checked_sub(rent_exempt_reserve)
                .ok_or(TokenError::Overflow)?;
            if new_amount < native_account.base.amount {
                return Err(TokenError::InvalidState.into());
            }
            native_account.base.amount = new_amount;
        } else {
            return Err(TokenError::NonNativeNotSupported.into());
        }

        native_account.pack_base();
        Ok(())
    }

    /// Processes an [InitializeMintCloseAuthority](enum.TokenInstruction.html) instruction
    pub fn process_initialize_mint_close_authority(
        accounts: &[AccountInfo],
        close_authority: COption<Pubkey>,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let mint_account_info = next_account_info(account_info_iter)?;

        let mut mint_data = mint_account_info.data.borrow_mut();
        let mut mint = StateWithExtensionsMut::<Mint>::unpack_uninitialized(&mut mint_data)?;
        let extension = mint.init_extension::<MintCloseAuthority>(true)?;
        extension.close_authority = close_authority.try_into()?;

        Ok(())
    }

    /// Processes a [GetAccountDataSize](enum.TokenInstruction.html) instruction
    pub fn process_get_account_data_size(
        accounts: &[AccountInfo],
        new_extension_types: Vec<ExtensionType>,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let mint_account_info = next_account_info(account_info_iter)?;

        let mut account_extensions = Self::get_required_account_extensions(mint_account_info)?;
        // ExtensionType::get_account_len() dedupes types, so just a dumb concatenation is fine
        // here
        account_extensions.extend_from_slice(&new_extension_types);

        let account_len = ExtensionType::get_account_len::<Account>(&account_extensions);
        set_return_data(&account_len.to_le_bytes());

        Ok(())
    }

    /// Processes an [InitializeImmutableOwner](enum.TokenInstruction.html) instruction
    pub fn process_initialize_immutable_owner(accounts: &[AccountInfo]) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let token_account_info = next_account_info(account_info_iter)?;
        let token_account_data = &mut token_account_info.data.borrow_mut();
        let mut token_account =
            StateWithExtensionsMut::<Account>::unpack_uninitialized(token_account_data)?;
        token_account
            .init_extension::<ImmutableOwner>(true)
            .map(|_| ())
    }

    /// Processes an [AmountToUiAmount](enum.TokenInstruction.html) instruction
    pub fn process_amount_to_ui_amount(accounts: &[AccountInfo], amount: u64) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let mint_info = next_account_info(account_info_iter)?;
        check_program_account(mint_info.owner)?;

        let mint_data = mint_info.data.borrow();
        let mint = StateWithExtensions::<Mint>::unpack(&mint_data)
            .map_err(|_| Into::<ProgramError>::into(TokenError::InvalidMint))?;
        let ui_amount = if let Ok(extension) = mint.get_extension::<InterestBearingConfig>() {
            let unix_timestamp = Clock::get()?.unix_timestamp;
            extension
                .amount_to_ui_amount(amount, mint.base.decimals, unix_timestamp)
                .ok_or(ProgramError::InvalidArgument)?
        } else {
            amount_to_ui_amount_string_trimmed(amount, mint.base.decimals)
        };

        set_return_data(&ui_amount.into_bytes());
        Ok(())
    }

    /// Processes an [AmountToUiAmount](enum.TokenInstruction.html) instruction
    pub fn process_ui_amount_to_amount(accounts: &[AccountInfo], ui_amount: &str) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let mint_info = next_account_info(account_info_iter)?;
        check_program_account(mint_info.owner)?;

        let mint_data = mint_info.data.borrow();
        let mint = StateWithExtensions::<Mint>::unpack(&mint_data)
            .map_err(|_| Into::<ProgramError>::into(TokenError::InvalidMint))?;
        let amount = if let Ok(extension) = mint.get_extension::<InterestBearingConfig>() {
            let unix_timestamp = Clock::get()?.unix_timestamp;
            extension.try_ui_amount_into_amount(ui_amount, mint.base.decimals, unix_timestamp)?
        } else {
            try_ui_amount_into_amount(ui_amount.to_string(), mint.base.decimals)?
        };

        set_return_data(&amount.to_le_bytes());
        Ok(())
    }

    /// Processes a [CreateNativeMint](enum.TokenInstruction.html) instruction
    pub fn process_create_native_mint(accounts: &[AccountInfo]) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let payer_info = next_account_info(account_info_iter)?;
        let native_mint_info = next_account_info(account_info_iter)?;
        let system_program_info = next_account_info(account_info_iter)?;

        if *native_mint_info.key != native_mint::id() {
            return Err(TokenError::InvalidMint.into());
        }

        let rent = Rent::get()?;
        let new_minimum_balance = rent.minimum_balance(Mint::get_packed_len());
        let lamports_diff = new_minimum_balance.saturating_sub(native_mint_info.lamports());
        invoke(
            &system_instruction::transfer(payer_info.key, native_mint_info.key, lamports_diff),
            &[
                payer_info.clone(),
                native_mint_info.clone(),
                system_program_info.clone(),
            ],
        )?;

        invoke_signed(
            &system_instruction::allocate(native_mint_info.key, Mint::get_packed_len() as u64),
            &[native_mint_info.clone(), system_program_info.clone()],
            &[native_mint::PROGRAM_ADDRESS_SEEDS],
        )?;

        invoke_signed(
            &system_instruction::assign(
                native_mint_info.key,
                &crate::program::spl_token_2022::id(),
            ),
            &[native_mint_info.clone(), system_program_info.clone()],
            &[native_mint::PROGRAM_ADDRESS_SEEDS],
        )?;

        Mint::pack(
            Mint {
                decimals: native_mint::DECIMALS,
                is_initialized: true,
                ..Mint::default()
            },
            &mut native_mint_info.data.borrow_mut(),
        )
    }

    /// Processes an [InitializeNonTransferableMint](enum.TokenInstruction.html) instruction
    pub fn process_initialize_non_transferable_mint(accounts: &[AccountInfo]) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let mint_account_info = next_account_info(account_info_iter)?;

        let mut mint_data = mint_account_info.data.borrow_mut();
        let mut mint = StateWithExtensionsMut::<Mint>::unpack_uninitialized(&mut mint_data)?;
        mint.init_extension::<NonTransferable>(true)?;

        Ok(())
    }

    /// Processes an [Instruction](enum.Instruction.html).
    pub fn process(program_id: &Pubkey, accounts: &[AccountInfo], input: &[u8]) -> ProgramResult {
        let instruction = TokenInstruction::unpack(input)?;

        match instruction {
            TokenInstruction::InitializeMint {
                decimals,
                mint_authority,
                freeze_authority,
            } => {
                msg!("Instruction: InitializeMint");
                Self::process_initialize_mint(accounts, decimals, mint_authority, freeze_authority)
            }
            TokenInstruction::InitializeMint2 {
                decimals,
                mint_authority,
                freeze_authority,
            } => {
                msg!("Instruction: InitializeMint2");
                Self::process_initialize_mint2(accounts, decimals, mint_authority, freeze_authority)
            }
            TokenInstruction::InitializeAccount => {
                msg!("Instruction: InitializeAccount");
                Self::process_initialize_account(accounts)
            }
            TokenInstruction::InitializeAccount2 { owner } => {
                msg!("Instruction: InitializeAccount2");
                Self::process_initialize_account2(accounts, owner)
            }
            TokenInstruction::InitializeAccount3 { owner } => {
                msg!("Instruction: InitializeAccount3");
                Self::process_initialize_account3(accounts, owner)
            }
            TokenInstruction::InitializeMultisig { m } => {
                msg!("Instruction: InitializeMultisig");
                Self::process_initialize_multisig(accounts, m)
            }
            TokenInstruction::InitializeMultisig2 { m } => {
                msg!("Instruction: InitializeMultisig2");
                Self::process_initialize_multisig2(accounts, m)
            }
            #[allow(deprecated)]
            TokenInstruction::Transfer { amount } => {
                msg!("Instruction: Transfer");
                Self::process_transfer(program_id, accounts, amount, None, None)
            }
            TokenInstruction::Approve { amount } => {
                msg!("Instruction: Approve");
                Self::process_approve(program_id, accounts, amount, None)
            }
            TokenInstruction::Revoke => {
                msg!("Instruction: Revoke");
                Self::process_revoke(program_id, accounts)
            }
            TokenInstruction::SetAuthority {
                authority_type,
                new_authority,
            } => {
                msg!("Instruction: SetAuthority");
                Self::process_set_authority(program_id, accounts, authority_type, new_authority)
            }
            TokenInstruction::MintTo { amount } => {
                msg!("Instruction: MintTo");
                Self::process_mint_to(program_id, accounts, amount, None)
            }
            TokenInstruction::Burn { amount } => {
                msg!("Instruction: Burn");
                Self::process_burn(program_id, accounts, amount, None)
            }
            TokenInstruction::CloseAccount => {
                msg!("Instruction: CloseAccount");
                Self::process_close_account(program_id, accounts)
            }
            TokenInstruction::FreezeAccount => {
                msg!("Instruction: FreezeAccount");
                Self::process_toggle_freeze_account(program_id, accounts, true)
            }
            TokenInstruction::ThawAccount => {
                msg!("Instruction: ThawAccount");
                Self::process_toggle_freeze_account(program_id, accounts, false)
            }
            TokenInstruction::TransferChecked { amount, decimals } => {
                msg!("Instruction: TransferChecked");
                Self::process_transfer(program_id, accounts, amount, Some(decimals), None)
            }
            TokenInstruction::ApproveChecked { amount, decimals } => {
                msg!("Instruction: ApproveChecked");
                Self::process_approve(program_id, accounts, amount, Some(decimals))
            }
            TokenInstruction::MintToChecked { amount, decimals } => {
                msg!("Instruction: MintToChecked");
                Self::process_mint_to(program_id, accounts, amount, Some(decimals))
            }
            TokenInstruction::BurnChecked { amount, decimals } => {
                msg!("Instruction: BurnChecked");
                Self::process_burn(program_id, accounts, amount, Some(decimals))
            }
            TokenInstruction::SyncNative => {
                msg!("Instruction: SyncNative");
                Self::process_sync_native(accounts)
            }
            TokenInstruction::GetAccountDataSize { extension_types } => {
                msg!("Instruction: GetAccountDataSize");
                Self::process_get_account_data_size(accounts, extension_types)
            }
            TokenInstruction::InitializeMintCloseAuthority { close_authority } => {
                msg!("Instruction: InitializeMintCloseAuthority");
                Self::process_initialize_mint_close_authority(accounts, close_authority)
            }
            TokenInstruction::TransferFeeExtension(instruction) => {
                transfer_fee::processor::process_instruction(program_id, accounts, instruction)
            }
            // TODO:
            TokenInstruction::ConfidentialTransferExtension => {
                Err(ProgramError::InvalidArgument)
                // confidential_transfer::processor::process_instruction(
                //     program_id,
                //     accounts,
                //     &input[1..],
                // )
            }
            TokenInstruction::DefaultAccountStateExtension => {
                default_account_state::processor::process_instruction(
                    program_id,
                    accounts,
                    &input[1..],
                )
            }
            TokenInstruction::InitializeImmutableOwner => {
                msg!("Instruction: InitializeImmutableOwner");
                Self::process_initialize_immutable_owner(accounts)
            }
            TokenInstruction::AmountToUiAmount { amount } => {
                msg!("Instruction: AmountToUiAmount");
                Self::process_amount_to_ui_amount(accounts, amount)
            }
            TokenInstruction::UiAmountToAmount { ui_amount } => {
                msg!("Instruction: UiAmountToAmount");
                Self::process_ui_amount_to_amount(accounts, ui_amount)
            }
            TokenInstruction::Reallocate { extension_types } => {
                msg!("Instruction: Reallocate");
                reallocate::process_reallocate(program_id, accounts, extension_types)
            }
            TokenInstruction::MemoTransferExtension => {
                memo_transfer::processor::process_instruction(program_id, accounts, &input[1..])
            }
            TokenInstruction::CreateNativeMint => {
                msg!("Instruction: CreateNativeMint");
                Self::process_create_native_mint(accounts)
            }
            TokenInstruction::InitializeNonTransferableMint => {
                msg!("Instruction: InitializeNonTransferableMint");
                Self::process_initialize_non_transferable_mint(accounts)
            }
            TokenInstruction::InterestBearingMintExtension => {
                interest_bearing_mint::processor::process_instruction(
                    program_id,
                    accounts,
                    &input[1..],
                )
            }
        }
    }

    /// Validates owner(s) are present. Used for Mints and Accounts only.
    pub fn validate_owner(
        program_id: &Pubkey,
        expected_owner: &Pubkey,
        owner_account_info: &AccountInfo,
        owner_account_data_len: usize,
        signers: &[AccountInfo],
    ) -> ProgramResult {
        if !cmp_pubkeys(expected_owner, owner_account_info.key) {
            return Err(TokenError::OwnerMismatch.into());
        }

        if cmp_pubkeys(program_id, owner_account_info.owner)
            && owner_account_data_len == Multisig::get_packed_len()
        {
            let multisig = Multisig::unpack(&owner_account_info.data.borrow())?;
            let mut num_signers = 0;
            let mut matched = [false; MAX_SIGNERS];
            for signer in signers.iter() {
                for (position, key) in multisig.signers[0..multisig.n as usize].iter().enumerate() {
                    if cmp_pubkeys(key, signer.key) && !matched[position] {
                        if !signer.is_signer {
                            return Err(ProgramError::MissingRequiredSignature);
                        }
                        matched[position] = true;
                        num_signers += 1;
                    }
                }
            }
            if num_signers < multisig.m {
                return Err(ProgramError::MissingRequiredSignature);
            }
            return Ok(());
        } else if !owner_account_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }
        Ok(())
    }

    fn get_required_account_extensions(
        mint_account_info: &AccountInfo,
    ) -> Result<Vec<ExtensionType>, ProgramError> {
        let mint_data = mint_account_info.data.borrow();
        let state = StateWithExtensions::<Mint>::unpack(&mint_data)
            .map_err(|_| Into::<ProgramError>::into(TokenError::InvalidMint))?;
        Self::get_required_account_extensions_from_unpacked_mint(mint_account_info.owner, &state)
    }

    fn get_required_account_extensions_from_unpacked_mint(
        token_program_id: &Pubkey,
        state: &StateWithExtensions<Mint>,
    ) -> Result<Vec<ExtensionType>, ProgramError> {
        check_program_account(token_program_id)?;
        let mint_extensions: Vec<ExtensionType> = state.get_extension_types()?;
        Ok(ExtensionType::get_required_init_account_extensions(
            &mint_extensions,
        ))
    }
}

impl PrintProgramError for TokenError {
    fn print<E>(&self)
    where
        E: 'static + std::error::Error + DecodeError<E> + PrintProgramError + FromPrimitive,
    {
        match self {
            TokenError::NotRentExempt => msg!("Error: Lamport balance below rent-exempt threshold"),
            TokenError::InsufficientFunds => msg!("Error: insufficient funds"),
            TokenError::InvalidMint => msg!("Error: Invalid Mint"),
            TokenError::MintMismatch => msg!("Error: Account not associated with this Mint"),
            TokenError::OwnerMismatch => msg!("Error: owner does not match"),
            TokenError::FixedSupply => msg!("Error: the total supply of this token is fixed"),
            TokenError::AlreadyInUse => msg!("Error: account or token already in use"),
            TokenError::InvalidNumberOfProvidedSigners => {
                msg!("Error: Invalid number of provided signers")
            }
            TokenError::InvalidNumberOfRequiredSigners => {
                msg!("Error: Invalid number of required signers")
            }
            TokenError::UninitializedState => msg!("Error: State is uninitialized"),
            TokenError::NativeNotSupported => {
                msg!("Error: Instruction does not support native tokens")
            }
            TokenError::NonNativeHasBalance => {
                msg!("Error: Non-native account can only be closed if its balance is zero")
            }
            TokenError::InvalidInstruction => msg!("Error: Invalid instruction"),
            TokenError::InvalidState => msg!("Error: Invalid account state for operation"),
            TokenError::Overflow => msg!("Error: Operation overflowed"),
            TokenError::AuthorityTypeNotSupported => {
                msg!("Error: Account does not support specified authority type")
            }
            TokenError::MintCannotFreeze => msg!("Error: This token mint cannot freeze accounts"),
            TokenError::AccountFrozen => msg!("Error: Account is frozen"),
            TokenError::MintDecimalsMismatch => {
                msg!("Error: decimals different from the Mint decimals")
            }
            TokenError::NonNativeNotSupported => {
                msg!("Error: Instruction does not support non-native tokens")
            }
            TokenError::ExtensionTypeMismatch => {
                msg!("Error: New extension type does not match already existing extensions")
            }
            TokenError::ExtensionBaseMismatch => {
                msg!("Error: Extension does not match the base type provided")
            }
            TokenError::ExtensionAlreadyInitialized => {
                msg!("Error: Extension already initialized on this account")
            }
            TokenError::ConfidentialTransferAccountHasBalance => {
                msg!("Error: An account can only be closed if its confidential balance is zero")
            }
            TokenError::ConfidentialTransferAccountNotApproved => {
                msg!("Error: Account not approved for confidential transfers")
            }
            TokenError::ConfidentialTransferDepositsAndTransfersDisabled => {
                msg!("Error: Account not accepting deposits or transfers")
            }
            TokenError::ConfidentialTransferElGamalPubkeyMismatch => {
                msg!("Error: ElGamal public key mismatch")
            }
            TokenError::ConfidentialTransferBalanceMismatch => {
                msg!("Error: Balance mismatch")
            }
            TokenError::MintHasSupply => {
                msg!("Error: Mint has non-zero supply. Burn all tokens before closing the mint")
            }
            TokenError::NoAuthorityExists => {
                msg!("Error: No authority exists to perform the desired operation");
            }
            TokenError::TransferFeeExceedsMaximum => {
                msg!("Error: Transfer fee exceeds maximum of 10,000 basis points");
            }
            TokenError::MintRequiredForTransfer => {
                msg!("Mint required for this account to transfer tokens, use `transfer_checked` or `transfer_checked_with_fee`");
            }
            TokenError::FeeMismatch => {
                msg!("Calculated fee does not match expected fee");
            }
            TokenError::FeeParametersMismatch => {
                msg!("Fee parameters associated with zero-knowledge proofs do not match fee parameters in mint")
            }
            TokenError::ImmutableOwner => {
                msg!("The owner authority cannot be changed");
            }
            TokenError::AccountHasWithheldTransferFees => {
                msg!("Error: An account can only be closed if its withheld fee balance is zero, harvest fees to the mint and try again");
            }
            TokenError::NoMemo => {
                msg!("Error: No memo in previous instruction; required for recipient to receive a transfer");
            }
            TokenError::NonTransferable => {
                msg!("Transfer is disabled for this mint");
            }
            TokenError::NonTransferableNeedsImmutableOwnership => {
                msg!("Non-transferable tokens can't be minted to an account without immutable ownership");
            }
            TokenError::MaximumPendingBalanceCreditCounterExceeded => {
                msg!("The total number of `Deposit` and `Transfer` instructions to an account cannot exceed the associated `maximum_pending_balance_credit_counter`");
            }
        }
    }
}
