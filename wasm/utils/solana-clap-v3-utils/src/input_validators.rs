use {
    crate::keypair::{parse_signer_source, SignerSourceKind, ASK_KEYWORD},
    chrono::DateTime,
    solana_sdk::{
        clock::{Epoch, Slot},
        hash::Hash,
        pubkey::{Pubkey, MAX_SEED_LEN},
        signature::{read_keypair_file, Signature},
    },
    std::{fmt::Display, str::FromStr},
};

fn is_parsable_generic<U>(string: &str) -> Result<(), String>
where
    U: FromStr,
    U::Err: Display,
{
    string
        .parse::<U>()
        .map(|_| ())
        .map_err(|err| format!("error parsing '{}': {}", string, err))
}

// Return an error if string cannot be parsed as type T.
// Takes a String to avoid second type parameter when used as a clap validator
pub fn is_parsable<T>(string: &str) -> Result<(), String>
where
    T: FromStr,
    T::Err: Display,
{
    is_parsable_generic::<T>(string)
}

// Return an error if string cannot be parsed as numeric type T, and value not within specified
// range
pub fn is_within_range<T>(string: &str, range_min: T, range_max: T) -> Result<(), String>
where
    T: FromStr + Copy + std::fmt::Debug + PartialOrd + std::ops::Add<Output = T> + From<usize>,
    T::Err: Display,
{
    match string.parse::<T>() {
        Ok(input) => {
            let range = range_min..range_max + 1.into();
            if !range.contains(&input) {
                Err(format!(
                    "input '{:?}' out of range ({:?}..{:?}]",
                    input, range_min, range_max
                ))
            } else {
                Ok(())
            }
        }
        Err(err) => Err(format!("error parsing '{}': {}", string, err)),
    }
}

// Return an error if a pubkey cannot be parsed.
pub fn is_pubkey(string: &str) -> Result<(), String> {
    is_parsable_generic::<Pubkey>(string)
}

// Return an error if a hash cannot be parsed.
pub fn is_hash(string: &str) -> Result<(), String> {
    is_parsable_generic::<Hash>(string)
}

// Return an error if a keypair file cannot be parsed.
pub fn is_keypair(string: &str) -> Result<(), String> {
    read_keypair_file(string)
        .map(|_| ())
        .map_err(|err| format!("{}", err))
}

// Return an error if a keypair file cannot be parsed
pub fn is_keypair_or_ask_keyword(string: &str) -> Result<(), String> {
    if string == ASK_KEYWORD {
        return Ok(());
    }
    read_keypair_file(string)
        .map(|_| ())
        .map_err(|err| format!("{}", err))
}

// Return an error if a `SignerSourceKind::Prompt` cannot be parsed
pub fn is_prompt_signer_source(string: &str) -> Result<(), String> {
    if string == ASK_KEYWORD {
        return Ok(());
    }
    match parse_signer_source(string)
        .map_err(|err| format!("{}", err))?
        .kind
    {
        SignerSourceKind::Prompt => Ok(()),
        _ => Err(format!(
            "Unable to parse input as `prompt:` URI scheme or `ASK` keyword: {}",
            string
        )),
    }
}

// Return an error if string cannot be parsed as pubkey string or keypair file location
pub fn is_pubkey_or_keypair(string: &str) -> Result<(), String> {
    is_pubkey(string).or_else(|_| is_keypair(string))
}

// Return an error if string cannot be parsed as a pubkey string, or a valid Signer that can
// produce a pubkey()
pub fn is_valid_pubkey(string: &str) -> Result<(), String> {
    match parse_signer_source(string)
        .map_err(|err| format!("{}", err))?
        .kind
    {
        SignerSourceKind::Filepath(path) => is_keypair(&path),
        _ => Ok(()),
    }
}

// Return an error if string cannot be parsed as a valid Signer. This is an alias of
// `is_valid_pubkey`, and does accept pubkey strings, even though a Pubkey is not by itself
// sufficient to sign a transaction.
//
// In the current offline-signing implementation, a pubkey is the valid input for a signer field
// when paired with an offline `--signer` argument to provide a Presigner (pubkey + signature).
// Clap validators can't check multiple fields at once, so the verification that a `--signer` is
// also provided and correct happens in parsing, not in validation.
pub fn is_valid_signer(string: &str) -> Result<(), String> {
    is_valid_pubkey(string)
}

// Return an error if string cannot be parsed as pubkey=signature string
pub fn is_pubkey_sig(string: &str) -> Result<(), String> {
    let mut signer = string.split('=');
    match Pubkey::from_str(
        signer
            .next()
            .ok_or_else(|| "Malformed signer string".to_string())?,
    ) {
        Ok(_) => {
            match Signature::from_str(
                signer
                    .next()
                    .ok_or_else(|| "Malformed signer string".to_string())?,
            ) {
                Ok(_) => Ok(()),
                Err(err) => Err(format!("{}", err)),
            }
        }
        Err(err) => Err(format!("{}", err)),
    }
}

// Return an error if a url cannot be parsed.
pub fn is_url(string: &str) -> Result<(), String> {
    match url::Url::parse(string) {
        Ok(url) => {
            if url.has_host() {
                Ok(())
            } else {
                Err("no host provided".to_string())
            }
        }
        Err(err) => Err(format!("{}", err)),
    }
}

pub fn is_url_or_moniker(string: &str) -> Result<(), String> {
    match url::Url::parse(&normalize_to_url_if_moniker(string)) {
        Ok(url) => {
            if url.has_host() {
                Ok(())
            } else {
                Err("no host provided".to_string())
            }
        }
        Err(err) => Err(format!("{}", err)),
    }
}

pub fn normalize_to_url_if_moniker<T: AsRef<str>>(url_or_moniker: T) -> String {
    match url_or_moniker.as_ref() {
        "m" | "mainnet-beta" => "https://api.mainnet-beta.solana.com",
        "t" | "testnet" => "https://api.testnet.solana.com",
        "d" | "devnet" => "https://api.devnet.solana.com",
        "l" | "localhost" => "http://localhost:8899",
        url => url,
    }
    .to_string()
}

pub fn is_epoch(epoch: &str) -> Result<(), String> {
    is_parsable_generic::<Epoch>(epoch)
}

pub fn is_slot(slot: &str) -> Result<(), String> {
    is_parsable_generic::<Slot>(slot)
}

pub fn is_pow2<T>(bins: T) -> Result<(), String>
where
    T: AsRef<str> + Display,
{
    bins.as_ref()
        .parse::<usize>()
        .map_err(|e| format!("Unable to parse, provided: {}, err: {}", bins, e))
        .and_then(|v| {
            if !v.is_power_of_two() {
                Err(format!("Must be a power of 2: {}", v))
            } else {
                Ok(())
            }
        })
}

pub fn is_port(port: &str) -> Result<(), String> {
    is_parsable_generic::<u16>(port)
}

pub fn is_valid_percentage<T>(percentage: T) -> Result<(), String>
where
    T: AsRef<str> + Display,
{
    percentage
        .as_ref()
        .parse::<u8>()
        .map_err(|e| {
            format!(
                "Unable to parse input percentage, provided: {}, err: {}",
                percentage, e
            )
        })
        .and_then(|v| {
            if v > 100 {
                Err(format!(
                    "Percentage must be in range of 0 to 100, provided: {}",
                    v
                ))
            } else {
                Ok(())
            }
        })
}

pub fn is_amount(amount: &str) -> Result<(), String> {
    if amount.parse::<u64>().is_ok() || amount.parse::<f64>().is_ok() {
        Ok(())
    } else {
        Err(format!(
            "Unable to parse input amount as integer or float, provided: {}",
            amount
        ))
    }
}

pub fn is_amount_or_all(amount: &str) -> Result<(), String> {
    if amount.parse::<u64>().is_ok() || amount.parse::<f64>().is_ok() || amount == "ALL" {
        Ok(())
    } else {
        Err(format!(
            "Unable to parse input amount as integer or float, provided: {}",
            amount
        ))
    }
}

pub fn is_rfc3339_datetime<T>(value: T) -> Result<(), String>
where
    T: AsRef<str> + Display,
{
    DateTime::parse_from_rfc3339(value.as_ref())
        .map(|_| ())
        .map_err(|e| format!("{}", e))
}

pub fn is_derivation<T>(value: T) -> Result<(), String>
where
    T: AsRef<str> + Display,
{
    let value = value.as_ref().replace('\'', "");
    let mut parts = value.split('/');
    let account = parts.next().unwrap();
    account
        .parse::<u32>()
        .map_err(|e| {
            format!(
                "Unable to parse derivation, provided: {}, err: {}",
                account, e
            )
        })
        .and_then(|_| {
            if let Some(change) = parts.next() {
                change.parse::<u32>().map_err(|e| {
                    format!(
                        "Unable to parse derivation, provided: {}, err: {}",
                        change, e
                    )
                })
            } else {
                Ok(0)
            }
        })
        .map(|_| ())
}

pub fn is_derived_address_seed(value: &str) -> Result<(), String> {
    if value.len() > MAX_SEED_LEN {
        Err(format!(
            "Address seed must not be longer than {} bytes",
            MAX_SEED_LEN
        ))
    } else {
        Ok(())
    }
}

// pub fn is_niceness_adjustment_valid<T>(value: T) -> Result<(), String>
// where
//     T: AsRef<str> + Display,
// {
//     let adjustment = value.as_ref().parse::<i8>().map_err(|err| {
//         format!(
//             "error parsing niceness adjustment value '{}': {}",
//             value, err
//         )
//     })?;
//     if solana_perf::thread::is_renice_allowed(adjustment) {
//         Ok(())
//     } else {
//         Err(String::from(
//             "niceness adjustment supported only on Linux; negative adjustment \
//              (priority increase) requires root or CAP_SYS_NICE (see `man 7 capabilities` \
//              for details)",
//         ))
//     }
// }

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_derivation() {
        assert_eq!(is_derivation("2"), Ok(()));
        assert_eq!(is_derivation("0"), Ok(()));
        assert_eq!(is_derivation("65537"), Ok(()));
        assert_eq!(is_derivation("0/2"), Ok(()));
        assert_eq!(is_derivation("0'/2'"), Ok(()));
        assert!(is_derivation("a").is_err());
        assert!(is_derivation("4294967296").is_err());
        assert!(is_derivation("a/b").is_err());
        assert!(is_derivation("0/4294967296").is_err());
    }

    // #[test]
    // fn test_is_niceness_adjustment_valid() {
    //     assert_eq!(is_niceness_adjustment_valid("0"), Ok(()));
    //     assert!(is_niceness_adjustment_valid("128").is_err());
    //     assert!(is_niceness_adjustment_valid("-129").is_err());
    // }
}
