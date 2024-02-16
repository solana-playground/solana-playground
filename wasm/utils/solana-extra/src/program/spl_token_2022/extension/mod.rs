// //! Extensions available to token mints and accounts

use {
    super::{
        error::TokenError,
        extension::{
            // TODO:
            // confidential_transfer::{ConfidentialTransferAccount, ConfidentialTransferMint},
            default_account_state::DefaultAccountState,
            immutable_owner::ImmutableOwner,
            interest_bearing_mint::InterestBearingConfig,
            memo_transfer::MemoTransfer,
            mint_close_authority::MintCloseAuthority,
            non_transferable::NonTransferable,
            transfer_fee::{TransferFeeAmount, TransferFeeConfig},
        },
        pod::*,
        state::{Account, Mint, Multisig},
    },
    bytemuck::{Pod, Zeroable},
    num_enum::{IntoPrimitive, TryFromPrimitive},
    solana_sdk::{
        program_error::ProgramError,
        program_pack::{IsInitialized, Pack},
    },
    std::{
        convert::{TryFrom, TryInto},
        mem::size_of,
    },
};

// TODO:
// /// Confidential Transfer extension
// pub mod confidential_transfer;
/// Default Account State extension
pub mod default_account_state;
/// Immutable Owner extension
pub mod immutable_owner;
/// Interest-Bearing Mint extension
pub mod interest_bearing_mint;
/// Memo Transfer extension
pub mod memo_transfer;
/// Mint Close Authority extension
pub mod mint_close_authority;
/// Non Transferable extension
pub mod non_transferable;
/// Utility to reallocate token accounts
pub mod reallocate;
// / Transfer Fee extension
pub mod transfer_fee;

/// Length in TLV structure
#[derive(Clone, Copy, Debug, Default, PartialEq, Pod, Zeroable)]
#[repr(transparent)]
pub struct Length(PodU16);
impl From<Length> for usize {
    fn from(n: Length) -> Self {
        Self::from(u16::from(n.0))
    }
}
impl TryFrom<usize> for Length {
    type Error = ProgramError;
    fn try_from(n: usize) -> Result<Self, Self::Error> {
        u16::try_from(n)
            .map(|v| Self(PodU16::from(v)))
            .map_err(|_| ProgramError::AccountDataTooSmall)
    }
}

/// Helper function to get the current TlvIndices from the current spot
fn get_tlv_indices(type_start: usize) -> TlvIndices {
    let length_start = type_start.saturating_add(size_of::<ExtensionType>());
    let value_start = length_start.saturating_add(pod_get_packed_len::<Length>());
    TlvIndices {
        type_start,
        length_start,
        value_start,
    }
}

/// Helper struct for returning the indices of the type, length, and value in
/// a TLV entry
#[derive(Debug)]
struct TlvIndices {
    pub type_start: usize,
    pub length_start: usize,
    pub value_start: usize,
}
fn get_extension_indices<V: Extension>(
    tlv_data: &[u8],
    init: bool,
) -> Result<TlvIndices, ProgramError> {
    let mut start_index = 0;
    let v_account_type = V::TYPE.get_account_type();
    while start_index < tlv_data.len() {
        let tlv_indices = get_tlv_indices(start_index);
        if tlv_data.len() < tlv_indices.value_start {
            return Err(ProgramError::InvalidAccountData);
        }
        let extension_type =
            ExtensionType::try_from(&tlv_data[tlv_indices.type_start..tlv_indices.length_start])?;
        let account_type = extension_type.get_account_type();
        // got to an empty spot, can init here, or move forward if not initing
        if extension_type == ExtensionType::Uninitialized {
            if init {
                return Ok(tlv_indices);
            } else {
                start_index = tlv_indices.length_start;
            }
        } else if extension_type == V::TYPE {
            // found an instance of the extension that we're initializing, return!
            return Ok(tlv_indices);
        } else if v_account_type != account_type {
            return Err(TokenError::ExtensionTypeMismatch.into());
        } else {
            let length = pod_from_bytes::<Length>(
                &tlv_data[tlv_indices.length_start..tlv_indices.value_start],
            )?;
            let value_end_index = tlv_indices.value_start.saturating_add(usize::from(*length));
            start_index = value_end_index;
        }
    }
    Err(ProgramError::InvalidAccountData)
}

fn get_extension_types(tlv_data: &[u8]) -> Result<Vec<ExtensionType>, ProgramError> {
    let mut extension_types = vec![];
    let mut start_index = 0;
    while start_index < tlv_data.len() {
        let tlv_indices = get_tlv_indices(start_index);
        if tlv_data.len() < tlv_indices.value_start {
            return Ok(extension_types);
        }
        let extension_type =
            ExtensionType::try_from(&tlv_data[tlv_indices.type_start..tlv_indices.length_start])?;
        if extension_type == ExtensionType::Uninitialized {
            return Ok(extension_types);
        } else {
            extension_types.push(extension_type);
            let length = pod_from_bytes::<Length>(
                &tlv_data[tlv_indices.length_start..tlv_indices.value_start],
            )?;

            let value_end_index = tlv_indices.value_start.saturating_add(usize::from(*length));
            start_index = value_end_index;
        }
    }
    Ok(extension_types)
}

fn get_first_extension_type(tlv_data: &[u8]) -> Result<Option<ExtensionType>, ProgramError> {
    if tlv_data.is_empty() {
        Ok(None)
    } else {
        let tlv_indices = get_tlv_indices(0);
        if tlv_data.len() <= tlv_indices.length_start {
            return Ok(None);
        }
        let extension_type =
            ExtensionType::try_from(&tlv_data[tlv_indices.type_start..tlv_indices.length_start])?;
        if extension_type == ExtensionType::Uninitialized {
            Ok(None)
        } else {
            Ok(Some(extension_type))
        }
    }
}

fn check_min_len_and_not_multisig(input: &[u8], minimum_len: usize) -> Result<(), ProgramError> {
    if input.len() == Multisig::LEN || input.len() < minimum_len {
        Err(ProgramError::InvalidAccountData)
    } else {
        Ok(())
    }
}

fn check_account_type<S: BaseState>(account_type: AccountType) -> Result<(), ProgramError> {
    if account_type != S::ACCOUNT_TYPE {
        Err(ProgramError::InvalidAccountData)
    } else {
        Ok(())
    }
}

/// Any account with extensions must be at least `Account::LEN`.  Both mints and
/// accounts can have extensions
/// A mint with extensions that takes it past 165 could be indiscernible from an
/// Account with an extension, even if we add the account type. For example,
/// let's say we have:
///
/// Account: 165 bytes... + [2, 0, 3, 0, 100, ....]
///                          ^     ^       ^     ^
///                     acct type  extension length data...
///
/// Mint: 82 bytes... + 83 bytes of other extension data + [2, 0, 3, 0, 100, ....]
///                                                         ^ data in extension just happens to look like this
///
/// With this approach, we only start writing the TLV data after Account::LEN,
/// which means we always know that the account type is going to be right after
/// that. We do a special case checking for a Multisig length, because those
/// aren't extensible under any circumstances.
const BASE_ACCOUNT_LENGTH: usize = Account::LEN;

fn type_and_tlv_indices<S: BaseState>(
    rest_input: &[u8],
) -> Result<Option<(usize, usize)>, ProgramError> {
    if rest_input.is_empty() {
        Ok(None)
    } else {
        let account_type_index = BASE_ACCOUNT_LENGTH.saturating_sub(S::LEN);
        // check padding is all zeroes
        let tlv_start_index = account_type_index.saturating_add(size_of::<AccountType>());
        if rest_input.len() <= tlv_start_index {
            return Err(ProgramError::InvalidAccountData);
        }
        if rest_input[..account_type_index] != vec![0; account_type_index] {
            Err(ProgramError::InvalidAccountData)
        } else {
            Ok(Some((account_type_index, tlv_start_index)))
        }
    }
}

/// Checks a base buffer to verify if it is an Account without having to completely deserialize it
fn is_initialized_account(input: &[u8]) -> Result<bool, ProgramError> {
    const ACCOUNT_INITIALIZED_INDEX: usize = 108; // See state.rs#L99

    if input.len() != BASE_ACCOUNT_LENGTH {
        return Err(ProgramError::InvalidAccountData);
    }
    Ok(input[ACCOUNT_INITIALIZED_INDEX] != 0)
}

fn get_extension<S: BaseState, V: Extension>(tlv_data: &[u8]) -> Result<&V, ProgramError> {
    if V::TYPE.get_account_type() != S::ACCOUNT_TYPE {
        return Err(ProgramError::InvalidAccountData);
    }
    let TlvIndices {
        type_start: _,
        length_start,
        value_start,
    } = get_extension_indices::<V>(tlv_data, false)?;
    // get_extension_indices has checked that tlv_data is long enough to include these indices
    let length = pod_from_bytes::<Length>(&tlv_data[length_start..value_start])?;
    let value_end = value_start.saturating_add(usize::from(*length));
    pod_from_bytes::<V>(&tlv_data[value_start..value_end])
}

/// Encapsulates owned immutable base state data (mint or account) with possible extensions
#[derive(Debug, PartialEq)]
pub struct StateWithExtensionsOwned<S: BaseState> {
    /// Unpacked base data
    pub base: S,
    /// Raw TLV data, deserialized on demand
    tlv_data: Vec<u8>,
}
impl<S: BaseState> StateWithExtensionsOwned<S> {
    /// Unpack base state, leaving the extension data as a slice
    ///
    /// Fails if the base state is not initialized.
    pub fn unpack(mut input: Vec<u8>) -> Result<Self, ProgramError> {
        check_min_len_and_not_multisig(&input, S::LEN)?;
        let mut rest = input.split_off(S::LEN);
        let base = S::unpack(&input)?;
        if let Some((account_type_index, tlv_start_index)) = type_and_tlv_indices::<S>(&rest)? {
            // type_and_tlv_indices() checks that returned indexes are within range
            let account_type = AccountType::try_from(rest[account_type_index])
                .map_err(|_| ProgramError::InvalidAccountData)?;
            check_account_type::<S>(account_type)?;
            let tlv_data = rest.split_off(tlv_start_index);
            Ok(Self { base, tlv_data })
        } else {
            Ok(Self {
                base,
                tlv_data: vec![],
            })
        }
    }

    /// Unpack a portion of the TLV data as the desired type
    pub fn get_extension<V: Extension>(&self) -> Result<&V, ProgramError> {
        get_extension::<S, V>(&self.tlv_data)
    }

    /// Iterates through the TLV entries, returning only the types
    pub fn get_extension_types(&self) -> Result<Vec<ExtensionType>, ProgramError> {
        get_extension_types(&self.tlv_data)
    }
}

/// Encapsulates immutable base state data (mint or account) with possible extensions
#[derive(Debug, PartialEq)]
pub struct StateWithExtensions<'data, S: BaseState> {
    /// Unpacked base data
    pub base: S,
    /// Slice of data containing all TLV data, deserialized on demand
    tlv_data: &'data [u8],
}
impl<'data, S: BaseState> StateWithExtensions<'data, S> {
    /// Unpack base state, leaving the extension data as a slice
    ///
    /// Fails if the base state is not initialized.
    pub fn unpack(input: &'data [u8]) -> Result<Self, ProgramError> {
        check_min_len_and_not_multisig(input, S::LEN)?;
        let (base_data, rest) = input.split_at(S::LEN);
        let base = S::unpack(base_data)?;
        if let Some((account_type_index, tlv_start_index)) = type_and_tlv_indices::<S>(rest)? {
            // type_and_tlv_indices() checks that returned indexes are within range
            let account_type = AccountType::try_from(rest[account_type_index])
                .map_err(|_| ProgramError::InvalidAccountData)?;
            check_account_type::<S>(account_type)?;
            Ok(Self {
                base,
                tlv_data: &rest[tlv_start_index..],
            })
        } else {
            Ok(Self {
                base,
                tlv_data: &[],
            })
        }
    }

    /// Unpack a portion of the TLV data as the desired type
    pub fn get_extension<V: Extension>(&self) -> Result<&V, ProgramError> {
        get_extension::<S, V>(self.tlv_data)
    }

    /// Iterates through the TLV entries, returning only the types
    pub fn get_extension_types(&self) -> Result<Vec<ExtensionType>, ProgramError> {
        get_extension_types(self.tlv_data)
    }
}

/// Encapsulates mutable base state data (mint or account) with possible extensions
#[derive(Debug, PartialEq)]
pub struct StateWithExtensionsMut<'data, S: BaseState> {
    /// Unpacked base data
    pub base: S,
    /// Raw base data
    base_data: &'data mut [u8],
    /// Writable account type
    account_type: &'data mut [u8],
    /// Slice of data containing all TLV data, deserialized on demand
    tlv_data: &'data mut [u8],
}
impl<'data, S: BaseState> StateWithExtensionsMut<'data, S> {
    /// Unpack base state, leaving the extension data as a mutable slice
    ///
    /// Fails if the base state is not initialized.
    pub fn unpack(input: &'data mut [u8]) -> Result<Self, ProgramError> {
        check_min_len_and_not_multisig(input, S::LEN)?;
        let (base_data, rest) = input.split_at_mut(S::LEN);
        let base = S::unpack(base_data)?;
        if let Some((account_type_index, tlv_start_index)) = type_and_tlv_indices::<S>(rest)? {
            // type_and_tlv_indices() checks that returned indexes are within range
            let account_type = AccountType::try_from(rest[account_type_index])
                .map_err(|_| ProgramError::InvalidAccountData)?;
            check_account_type::<S>(account_type)?;
            let (account_type, tlv_data) = rest.split_at_mut(tlv_start_index);
            Ok(Self {
                base,
                base_data,
                account_type: &mut account_type[account_type_index..tlv_start_index],
                tlv_data,
            })
        } else {
            Ok(Self {
                base,
                base_data,
                account_type: &mut [],
                tlv_data: &mut [],
            })
        }
    }

    /// Unpack an uninitialized base state, leaving the extension data as a mutable slice
    ///
    /// Fails if the base state has already been initialized.
    pub fn unpack_uninitialized(input: &'data mut [u8]) -> Result<Self, ProgramError> {
        check_min_len_and_not_multisig(input, S::LEN)?;
        let (base_data, rest) = input.split_at_mut(S::LEN);
        let base = S::unpack_unchecked(base_data)?;
        if base.is_initialized() {
            return Err(TokenError::AlreadyInUse.into());
        }
        if let Some((account_type_index, tlv_start_index)) = type_and_tlv_indices::<S>(rest)? {
            // type_and_tlv_indices() checks that returned indexes are within range
            let account_type = AccountType::try_from(rest[account_type_index])
                .map_err(|_| ProgramError::InvalidAccountData)?;
            if account_type != AccountType::Uninitialized {
                return Err(ProgramError::InvalidAccountData);
            }
            let (account_type, tlv_data) = rest.split_at_mut(tlv_start_index);
            let state = Self {
                base,
                base_data,
                account_type: &mut account_type[account_type_index..tlv_start_index],
                tlv_data,
            };
            if let Some(extension_type) = state.get_first_extension_type()? {
                let account_type = extension_type.get_account_type();
                if account_type != S::ACCOUNT_TYPE {
                    return Err(TokenError::ExtensionBaseMismatch.into());
                }
            }
            Ok(state)
        } else {
            Ok(Self {
                base,
                base_data,
                account_type: &mut [],
                tlv_data: &mut [],
            })
        }
    }

    /// Unpack a portion of the TLV data as the desired type that allows modifying the type
    pub fn get_extension_mut<V: Extension>(&mut self) -> Result<&mut V, ProgramError> {
        if V::TYPE.get_account_type() != S::ACCOUNT_TYPE {
            return Err(ProgramError::InvalidAccountData);
        }
        let TlvIndices {
            type_start,
            length_start,
            value_start,
        } = get_extension_indices::<V>(self.tlv_data, false)?;

        if self.tlv_data[type_start..].len() < V::TYPE.get_tlv_len() {
            return Err(ProgramError::InvalidAccountData);
        }
        let length = pod_from_bytes::<Length>(&self.tlv_data[length_start..value_start])?;
        let value_end = value_start.saturating_add(usize::from(*length));
        pod_from_bytes_mut::<V>(&mut self.tlv_data[value_start..value_end])
    }

    /// Unpack a portion of the TLV data as the desired type
    pub fn get_extension<V: Extension>(&self) -> Result<&V, ProgramError> {
        if V::TYPE.get_account_type() != S::ACCOUNT_TYPE {
            return Err(ProgramError::InvalidAccountData);
        }
        let TlvIndices {
            type_start,
            length_start,
            value_start,
        } = get_extension_indices::<V>(self.tlv_data, false)?;

        if self.tlv_data[type_start..].len() < V::TYPE.get_tlv_len() {
            return Err(ProgramError::InvalidAccountData);
        }
        let length = pod_from_bytes::<Length>(&self.tlv_data[length_start..value_start])?;
        let value_end = value_start.saturating_add(usize::from(*length));
        pod_from_bytes::<V>(&self.tlv_data[value_start..value_end])
    }

    /// Packs base state data into the base data portion
    pub fn pack_base(&mut self) {
        S::pack_into_slice(&self.base, self.base_data);
    }

    /// Packs the default extension data into an open slot if not already found in the
    /// data buffer. If extension is already found in the buffer, it overwrites the existing
    /// extension with the default state if `overwrite` is set. If extension found, but
    /// `overwrite` is not set, it returns error.
    pub fn init_extension<V: Extension>(
        &mut self,
        overwrite: bool,
    ) -> Result<&mut V, ProgramError> {
        if V::TYPE.get_account_type() != S::ACCOUNT_TYPE {
            return Err(ProgramError::InvalidAccountData);
        }
        let TlvIndices {
            type_start,
            length_start,
            value_start,
        } = get_extension_indices::<V>(self.tlv_data, true)?;

        if self.tlv_data[type_start..].len() < V::TYPE.get_tlv_len() {
            return Err(ProgramError::InvalidAccountData);
        }
        let extension_type = ExtensionType::try_from(&self.tlv_data[type_start..length_start])?;

        if extension_type == ExtensionType::Uninitialized || overwrite {
            // write extension type
            let extension_type_array: [u8; 2] = V::TYPE.into();
            let extension_type_ref = &mut self.tlv_data[type_start..length_start];
            extension_type_ref.copy_from_slice(&extension_type_array);
            // write length
            let length_ref =
                pod_from_bytes_mut::<Length>(&mut self.tlv_data[length_start..value_start])?;
            // maybe this becomes smarter later for dynamically sized extensions
            let length = pod_get_packed_len::<V>();
            *length_ref = Length::try_from(length).unwrap();

            let value_end = value_start.saturating_add(length);
            let extension_ref =
                pod_from_bytes_mut::<V>(&mut self.tlv_data[value_start..value_end])?;
            *extension_ref = V::default();
            Ok(extension_ref)
        } else {
            // extension is already initialized, but no overwrite permission
            Err(TokenError::ExtensionAlreadyInitialized.into())
        }
    }

    /// If `extension_type` is an Account-associated ExtensionType that requires initialization on
    /// InitializeAccount, this method packs the default relevant Extension of an ExtensionType
    /// into an open slot if not already found in the data buffer, otherwise overwrites the
    /// existing extension with the default state. For all other ExtensionTypes, this is a no-op.
    pub fn init_account_extension_from_type(
        &mut self,
        extension_type: ExtensionType,
    ) -> Result<(), ProgramError> {
        if extension_type.get_account_type() != AccountType::Account {
            return Ok(());
        }
        match extension_type {
            ExtensionType::TransferFeeAmount => {
                self.init_extension::<TransferFeeAmount>(true).map(|_| ())
            }
            // ConfidentialTransfers are currently opt-in only, so this is a no-op for extra safety
            // on InitializeAccount
            ExtensionType::ConfidentialTransferAccount => Ok(()),
            _ => unreachable!(),
        }
    }

    /// Write the account type into the buffer, done during the base
    /// state initialization
    /// Noops if there is no room for an extension in the account, needed for
    /// pure base mints / accounts.
    pub fn init_account_type(&mut self) -> Result<(), ProgramError> {
        if !self.account_type.is_empty() {
            if let Some(extension_type) = self.get_first_extension_type()? {
                let account_type = extension_type.get_account_type();
                if account_type != S::ACCOUNT_TYPE {
                    return Err(TokenError::ExtensionBaseMismatch.into());
                }
            }
            self.account_type[0] = S::ACCOUNT_TYPE.into();
        }
        Ok(())
    }

    /// Iterates through the TLV entries, returning only the types
    pub fn get_extension_types(&self) -> Result<Vec<ExtensionType>, ProgramError> {
        get_extension_types(self.tlv_data)
    }

    fn get_first_extension_type(&self) -> Result<Option<ExtensionType>, ProgramError> {
        get_first_extension_type(self.tlv_data)
    }
}

/// If AccountType is uninitialized, set it to the BaseState's ACCOUNT_TYPE;
/// if AccountType is already set, check is set correctly for BaseState
/// This method assumes that the `base_data` has already been packed with data of the desired type.
pub fn set_account_type<S: BaseState>(input: &mut [u8]) -> Result<(), ProgramError> {
    check_min_len_and_not_multisig(input, S::LEN)?;
    let (base_data, rest) = input.split_at_mut(S::LEN);
    if S::ACCOUNT_TYPE == AccountType::Account && !is_initialized_account(base_data)? {
        return Err(ProgramError::InvalidAccountData);
    }
    if let Some((account_type_index, _tlv_start_index)) = type_and_tlv_indices::<S>(rest)? {
        let mut account_type = AccountType::try_from(rest[account_type_index])
            .map_err(|_| ProgramError::InvalidAccountData)?;
        if account_type == AccountType::Uninitialized {
            rest[account_type_index] = S::ACCOUNT_TYPE.into();
            account_type = S::ACCOUNT_TYPE;
        }
        check_account_type::<S>(account_type)?;
        Ok(())
    } else {
        Err(ProgramError::InvalidAccountData)
    }
}

/// Different kinds of accounts. Note that `Mint`, `Account`, and `Multisig` types
/// are determined exclusively by the size of the account, and are not included in
/// the account data. `AccountType` is only included if extensions have been
/// initialized.
#[repr(u8)]
#[derive(Clone, Copy, Debug, Default, PartialEq, TryFromPrimitive, IntoPrimitive)]
pub enum AccountType {
    /// Marker for 0 data
    #[default]
    Uninitialized,
    /// Mint account with additional extensions
    Mint,
    /// Token holding account with additional extensions
    Account,
}

/// Extensions that can be applied to mints or accounts.  Mint extensions must only be
/// applied to mint accounts, and account extensions must only be applied to token holding
/// accounts.
#[repr(u16)]
#[derive(Clone, Copy, Debug, PartialEq, TryFromPrimitive, IntoPrimitive)]
pub enum ExtensionType {
    /// Used as padding if the account size would otherwise be 355, same as a multisig
    Uninitialized,
    /// Includes transfer fee rate info and accompanying authorities to withdraw and set the fee
    TransferFeeConfig,
    /// Includes withheld transfer fees
    TransferFeeAmount,
    /// Includes an optional mint close authority
    MintCloseAuthority,
    /// Auditor configuration for confidential transfers
    ConfidentialTransferMint,
    /// State for confidential transfers
    ConfidentialTransferAccount,
    /// Specifies the default Account::state for new Accounts
    DefaultAccountState,
    /// Indicates that the Account owner authority cannot be changed
    ImmutableOwner,
    /// Require inbound transfers to have memo
    MemoTransfer,
    /// Indicates that the tokens from this mint can't be transferred
    NonTransferable,
    /// Tokens accrue interest over time,
    InterestBearingConfig,
    /// Padding extension used to make an account exactly Multisig::LEN, used for testing
    #[cfg(test)]
    AccountPaddingTest = u16::MAX - 1,
    /// Padding extension used to make a mint exactly Multisig::LEN, used for testing
    #[cfg(test)]
    MintPaddingTest = u16::MAX,
}
impl TryFrom<&[u8]> for ExtensionType {
    type Error = ProgramError;
    fn try_from(a: &[u8]) -> Result<Self, Self::Error> {
        Self::try_from(u16::from_le_bytes(
            a.try_into().map_err(|_| ProgramError::InvalidAccountData)?,
        ))
        .map_err(|_| ProgramError::InvalidAccountData)
    }
}
impl From<ExtensionType> for [u8; 2] {
    fn from(a: ExtensionType) -> Self {
        u16::from(a).to_le_bytes()
    }
}
impl ExtensionType {
    /// Get the data length of the type associated with the enum
    pub fn get_type_len(&self) -> usize {
        match self {
            ExtensionType::Uninitialized => 0,
            ExtensionType::TransferFeeConfig => pod_get_packed_len::<TransferFeeConfig>(),
            ExtensionType::TransferFeeAmount => pod_get_packed_len::<TransferFeeAmount>(),
            ExtensionType::MintCloseAuthority => pod_get_packed_len::<MintCloseAuthority>(),
            ExtensionType::ImmutableOwner => pod_get_packed_len::<ImmutableOwner>(),
            ExtensionType::ConfidentialTransferMint => {
                // TODO:
                // pod_get_packed_len::<ConfidentialTransferMint>()
                0
            }
            ExtensionType::ConfidentialTransferAccount => {
                // TODO:
                // pod_get_packed_len::<ConfidentialTransferAccount>()
                0
            }
            ExtensionType::DefaultAccountState => pod_get_packed_len::<DefaultAccountState>(),
            ExtensionType::MemoTransfer => pod_get_packed_len::<MemoTransfer>(),
            ExtensionType::NonTransferable => pod_get_packed_len::<NonTransferable>(),
            ExtensionType::InterestBearingConfig => pod_get_packed_len::<InterestBearingConfig>(),
            #[cfg(test)]
            ExtensionType::AccountPaddingTest => 0,
            #[cfg(test)]
            ExtensionType::MintPaddingTest => 0,
        }
    }

    /// Get the TLV length for an ExtensionType
    fn get_tlv_len(&self) -> usize {
        self.get_type_len()
            .saturating_add(size_of::<ExtensionType>())
            .saturating_add(pod_get_packed_len::<Length>())
    }

    /// Get the TLV length for a set of ExtensionTypes
    fn get_total_tlv_len(extension_types: &[Self]) -> usize {
        // dedupe extensions
        let mut extensions = vec![];
        for extension_type in extension_types {
            if !extensions.contains(&extension_type) {
                extensions.push(extension_type);
            }
        }
        let tlv_len: usize = extensions.iter().map(|e| e.get_tlv_len()).sum();
        if tlv_len
            == Multisig::LEN
                .saturating_sub(BASE_ACCOUNT_LENGTH)
                .saturating_sub(size_of::<AccountType>())
        {
            tlv_len.saturating_add(size_of::<ExtensionType>())
        } else {
            tlv_len
        }
    }

    /// Get the required account data length for the given ExtensionTypes
    pub fn get_account_len<S: BaseState>(extension_types: &[Self]) -> usize {
        if extension_types.is_empty() {
            S::LEN
        } else {
            let extension_size = Self::get_total_tlv_len(extension_types);
            extension_size
                .saturating_add(BASE_ACCOUNT_LENGTH)
                .saturating_add(size_of::<AccountType>())
        }
    }

    /// Get the associated account type
    pub fn get_account_type(&self) -> AccountType {
        match self {
            ExtensionType::Uninitialized => AccountType::Uninitialized,
            ExtensionType::TransferFeeConfig
            | ExtensionType::MintCloseAuthority
            | ExtensionType::ConfidentialTransferMint
            | ExtensionType::DefaultAccountState
            | ExtensionType::NonTransferable
            | ExtensionType::InterestBearingConfig => AccountType::Mint,
            ExtensionType::ImmutableOwner
            | ExtensionType::TransferFeeAmount
            | ExtensionType::ConfidentialTransferAccount
            | ExtensionType::MemoTransfer => AccountType::Account,
            #[cfg(test)]
            ExtensionType::AccountPaddingTest => AccountType::Account,
            #[cfg(test)]
            ExtensionType::MintPaddingTest => AccountType::Mint,
        }
    }

    /// Based on a set of AccountType::Mint ExtensionTypes, get the list of AccountType::Account
    /// ExtensionTypes required on InitializeAccount
    pub fn get_required_init_account_extensions(mint_extension_types: &[Self]) -> Vec<Self> {
        let mut account_extension_types = vec![];
        for extension_type in mint_extension_types {
            #[allow(clippy::single_match)]
            match extension_type {
                ExtensionType::TransferFeeConfig => {
                    account_extension_types.push(ExtensionType::TransferFeeAmount);
                }
                #[cfg(test)]
                ExtensionType::MintPaddingTest => {
                    account_extension_types.push(ExtensionType::AccountPaddingTest);
                }
                _ => {}
            }
        }
        account_extension_types
    }
}

/// Trait for base states, specifying the associated enum
pub trait BaseState: Pack + IsInitialized {
    /// Associated extension type enum, checked at the start of TLV entries
    const ACCOUNT_TYPE: AccountType;
}
impl BaseState for Account {
    const ACCOUNT_TYPE: AccountType = AccountType::Account;
}
impl BaseState for Mint {
    const ACCOUNT_TYPE: AccountType = AccountType::Mint;
}

/// Trait to be implemented by all extension states, specifying which extension
/// and account type they are associated with
pub trait Extension: Pod + Default {
    /// Associated extension type enum, checked at the start of TLV entries
    const TYPE: ExtensionType;
}
