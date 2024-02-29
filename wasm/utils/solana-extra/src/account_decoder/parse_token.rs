use std::str::FromStr;

use super::{parse_token_extension::UiExtension, StringAmount, StringDecimals};
use crate::program::spl_token_2022::state::AccountState;

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum UiAccountState {
    Uninitialized,
    Initialized,
    Frozen,
}

impl From<AccountState> for UiAccountState {
    fn from(state: AccountState) -> Self {
        match state {
            AccountState::Uninitialized => UiAccountState::Uninitialized,
            AccountState::Initialized => UiAccountState::Initialized,
            AccountState::Frozen => UiAccountState::Frozen,
        }
    }
}

pub fn real_number_string(amount: u64, decimals: u8) -> StringDecimals {
    let decimals = decimals as usize;
    if decimals > 0 {
        // Left-pad zeros to decimals + 1, so we at least have an integer zero
        let mut s = format!("{:01$}", amount, decimals + 1);
        // Add the decimal point (Sorry, "," locales!)
        s.insert(s.len() - decimals, '.');
        s
    } else {
        amount.to_string()
    }
}

pub fn real_number_string_trimmed(amount: u64, decimals: u8) -> StringDecimals {
    let mut s = real_number_string(amount, decimals);
    if decimals > 0 {
        let zeros_trimmed = s.trim_end_matches('0');
        s = zeros_trimmed.trim_end_matches('.').to_string();
    }
    s
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct UiTokenAmount {
    pub ui_amount: Option<f64>,
    pub decimals: u8,
    pub amount: StringAmount,
    pub ui_amount_string: StringDecimals,
}

impl UiTokenAmount {
    pub fn real_number_string(&self) -> String {
        real_number_string(
            u64::from_str(&self.amount).unwrap_or_default(),
            self.decimals,
        )
    }

    pub fn real_number_string_trimmed(&self) -> String {
        if !self.ui_amount_string.is_empty() {
            self.ui_amount_string.clone()
        } else {
            real_number_string_trimmed(
                u64::from_str(&self.amount).unwrap_or_default(),
                self.decimals,
            )
        }
    }
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct UiTokenAccount {
    pub mint: String,
    pub owner: String,
    pub token_amount: UiTokenAmount,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub delegate: Option<String>,
    pub state: UiAccountState,
    pub is_native: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rent_exempt_reserve: Option<UiTokenAmount>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub delegated_amount: Option<UiTokenAmount>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub close_authority: Option<String>,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub extensions: Vec<UiExtension>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct UiMint {
    pub mint_authority: Option<String>,
    pub supply: StringAmount,
    pub decimals: u8,
    pub is_initialized: bool,
    pub freeze_authority: Option<String>,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub extensions: Vec<UiExtension>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct UiMultisig {
    pub num_required_signers: u8,
    pub num_valid_signers: u8,
    pub is_initialized: bool,
    pub signers: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", tag = "type", content = "info")]
#[allow(clippy::large_enum_variant)]
pub enum TokenAccountType {
    Account(UiTokenAccount),
    Mint(UiMint),
    Multisig(UiMultisig),
}
