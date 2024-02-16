use {
    crate::program::spl_token_2022::{
        extension::{Extension, ExtensionType},
        pod::{OptionalNonZeroPubkey, PodI16, PodI64},
    },
    bytemuck::{Pod, Zeroable},
    solana_sdk::program_error::ProgramError,
    std::convert::TryInto,
};

/// Interest-bearing mint extension instructions
pub mod instruction;

/// Interest-bearing mint extension processor
pub mod processor;

/// Annual interest rate, expressed as basis points
pub type BasisPoints = PodI16;
const ONE_IN_BASIS_POINTS: f64 = 10_000.;
const SECONDS_PER_YEAR: f64 = 60. * 60. * 24. * 365.24;

/// UnixTimestamp expressed with an alignment-independent type
pub type UnixTimestamp = PodI64;

/// Interest-bearing extension data for mints
///
/// Tokens accrue interest at an annual rate expressed by `current_rate`,
/// compounded continuously, so APY will be higher than the published interest
/// rate.
///
/// To support changing the rate, the config also maintains state for the previous
/// rate.
#[repr(C)]
#[derive(Clone, Copy, Debug, Default, PartialEq, Pod, Zeroable)]
pub struct InterestBearingConfig {
    /// Authority that can set the interest rate and authority
    pub rate_authority: OptionalNonZeroPubkey,
    /// Timestamp of initialization, from which to base interest calculations
    pub initialization_timestamp: UnixTimestamp,
    /// Average rate from initialization until the last time it was updated
    pub pre_update_average_rate: BasisPoints,
    /// Timestamp of the last update, used to calculate the total amount accrued
    pub last_update_timestamp: UnixTimestamp,
    /// Current rate, since the last update
    pub current_rate: BasisPoints,
}
impl InterestBearingConfig {
    fn pre_update_timespan(&self) -> Option<i64> {
        i64::from(self.last_update_timestamp).checked_sub(self.initialization_timestamp.into())
    }

    fn pre_update_exp(&self) -> Option<f64> {
        let numerator = (i16::from(self.pre_update_average_rate) as i128)
            .checked_mul(self.pre_update_timespan()? as i128)? as f64;
        let exponent = numerator / SECONDS_PER_YEAR / ONE_IN_BASIS_POINTS;
        Some(exponent.exp())
    }

    fn post_update_timespan(&self, unix_timestamp: i64) -> Option<i64> {
        unix_timestamp.checked_sub(self.last_update_timestamp.into())
    }

    fn post_update_exp(&self, unix_timestamp: i64) -> Option<f64> {
        let numerator = (i16::from(self.current_rate) as i128)
            .checked_mul(self.post_update_timespan(unix_timestamp)? as i128)?
            as f64;
        let exponent = numerator / SECONDS_PER_YEAR / ONE_IN_BASIS_POINTS;
        Some(exponent.exp())
    }

    fn total_scale(&self, decimals: u8, unix_timestamp: i64) -> Option<f64> {
        Some(
            self.pre_update_exp()? * self.post_update_exp(unix_timestamp)?
                / 10_f64.powi(decimals as i32),
        )
    }

    /// Convert a raw amount to its UI representation using the given decimals field
    /// Excess zeroes or unneeded decimal point are trimmed.
    pub fn amount_to_ui_amount(
        &self,
        amount: u64,
        decimals: u8,
        unix_timestamp: i64,
    ) -> Option<String> {
        let scaled_amount_with_interest =
            (amount as f64) * self.total_scale(decimals, unix_timestamp)?;
        Some(scaled_amount_with_interest.to_string())
    }

    /// Try to convert a UI representation of a token amount to its raw amount using the given decimals
    /// field
    pub fn try_ui_amount_into_amount(
        &self,
        ui_amount: &str,
        decimals: u8,
        unix_timestamp: i64,
    ) -> Result<u64, ProgramError> {
        let scaled_amount = ui_amount
            .parse::<f64>()
            .map_err(|_| ProgramError::InvalidArgument)?;
        let amount = scaled_amount
            / self
                .total_scale(decimals, unix_timestamp)
                .ok_or(ProgramError::InvalidArgument)?;
        if amount > (u64::MAX as f64) || amount < (u64::MIN as f64) || amount.is_nan() {
            Err(ProgramError::InvalidArgument)
        } else {
            Ok(amount.round() as u64) // this is important, if you round earlier, you'll get wrong "inf" answers
        }
    }

    /// The new average rate is the time-weighted average of the current rate and average rate,
    /// solving for r such that:
    ///
    /// exp(r_1 * t_1) * exp(r_2 * t_2) = exp(r * (t_1 + t_2))
    ///
    /// r_1 * t_1 + r_2 * t_2 = r * (t_1 + t_2)
    ///
    /// r = (r_1 * t_1 + r_2 * t_2) / (t_1 + t_2)
    pub fn time_weighted_average_rate(&self, current_timestamp: i64) -> Option<i16> {
        let initialization_timestamp = i64::from(self.initialization_timestamp) as i128;
        let last_update_timestamp = i64::from(self.last_update_timestamp) as i128;

        let r_1 = i16::from(self.pre_update_average_rate) as i128;
        let t_1 = last_update_timestamp.checked_sub(initialization_timestamp)?;
        let r_2 = i16::from(self.current_rate) as i128;
        let t_2 = (current_timestamp as i128).checked_sub(last_update_timestamp)?;
        let total_timespan = t_1.checked_add(t_2)?;
        let average_rate = if total_timespan == 0 {
            // happens in testing situations, just use the new rate since the earlier
            // one was never practically used
            r_2
        } else {
            r_1.checked_mul(t_1)?
                .checked_add(r_2.checked_mul(t_2)?)?
                .checked_div(total_timespan)?
        };
        average_rate.try_into().ok()
    }
}
impl Extension for InterestBearingConfig {
    const TYPE: ExtensionType = ExtensionType::InterestBearingConfig;
}
