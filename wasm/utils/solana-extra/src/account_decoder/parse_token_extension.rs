use solana_sdk::pubkey::Pubkey;

use crate::program::spl_token_2022::extension;

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct UiTransferFee {
    pub epoch: u64,
    pub maximum_fee: u64,
    pub transfer_fee_basis_points: u16,
}

impl From<extension::transfer_fee::TransferFee> for UiTransferFee {
    fn from(transfer_fee: extension::transfer_fee::TransferFee) -> Self {
        Self {
            epoch: u64::from(transfer_fee.epoch),
            maximum_fee: u64::from(transfer_fee.maximum_fee),
            transfer_fee_basis_points: u16::from(transfer_fee.transfer_fee_basis_points),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct UiTransferFeeConfig {
    pub transfer_fee_config_authority: Option<String>,
    pub withdraw_withheld_authority: Option<String>,
    pub withheld_amount: u64,
    pub older_transfer_fee: UiTransferFee,
    pub newer_transfer_fee: UiTransferFee,
}

impl From<extension::transfer_fee::TransferFeeConfig> for UiTransferFeeConfig {
    fn from(transfer_fee_config: extension::transfer_fee::TransferFeeConfig) -> Self {
        let transfer_fee_config_authority: Option<Pubkey> =
            transfer_fee_config.transfer_fee_config_authority.into();
        let withdraw_withheld_authority: Option<Pubkey> =
            transfer_fee_config.withdraw_withheld_authority.into();

        Self {
            transfer_fee_config_authority: transfer_fee_config_authority
                .map(|pubkey| pubkey.to_string()),
            withdraw_withheld_authority: withdraw_withheld_authority
                .map(|pubkey| pubkey.to_string()),
            withheld_amount: u64::from(transfer_fee_config.withheld_amount),
            older_transfer_fee: transfer_fee_config.older_transfer_fee.into(),
            newer_transfer_fee: transfer_fee_config.newer_transfer_fee.into(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", tag = "extension", content = "state")]
pub enum UiExtension {
    Uninitialized,
    TransferFeeConfig(UiTransferFeeConfig),
    // TransferFeeAmount(UiTransferFeeAmount),
    // MintCloseAuthority(UiMintCloseAuthority),
    // ConfidentialTransferMint,    // Implementation of extension state to come
    // ConfidentialTransferAccount, // Implementation of extension state to come
    // DefaultAccountState(UiDefaultAccountState),
    // ImmutableOwner,
    // MemoTransfer(UiMemoTransfer),
    // UnparseableExtension,
}
