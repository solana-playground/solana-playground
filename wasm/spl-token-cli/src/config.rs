use std::{rc::Rc, sync::Arc};

use clap::ArgMatches;
use solana_clap_v3_utils_wasm::{
    input_parsers::{pubkey_of, pubkey_of_signer},
    input_validators::normalize_to_url_if_moniker,
    keypair::signer_from_path,
    offline::SIGN_ONLY_ARG,
};
use solana_cli_config_wasm::{Config as CliConfig, ConfigInput};
use solana_cli_output_wasm::cli_output::OutputFormat;
use solana_client_wasm::{utils::rpc_config::BlockhashQuery, WasmClient};
use solana_extra_wasm::program::spl_associated_token_account::get_associated_token_address_with_program_id;
use solana_remote_wallet::remote_wallet::RemoteWalletManager;
use solana_sdk::{
    pubkey::Pubkey,
    signature::{Keypair, Signer},
};

use crate::utils::blockhash_query_from_matches;

pub struct Config<'a> {
    pub(crate) rpc_client: Arc<WasmClient>,
    // pub(crate) websocket_url: String,
    pub(crate) output_format: OutputFormat,
    pub(crate) keypair_bytes: &'a [u8],
    pub(crate) fee_payer: Pubkey,
    pub(crate) nonce_account: Option<Pubkey>,
    pub(crate) nonce_authority: Option<Pubkey>,
    pub(crate) blockhash_query: BlockhashQuery,
    pub(crate) sign_only: bool,
    pub(crate) dump_transaction_message: bool,
    pub(crate) multisigner_pubkeys: Vec<&'a Pubkey>,
    pub(crate) program_id: Pubkey,
}

impl<'a> Config<'a> {
    // Check if an explicit token account address was provided, otherwise
    // return the associated token address for the default address.
    pub(crate) fn associated_token_address_or_override(
        &self,
        arg_matches: &ArgMatches,
        override_name: &str,
        wallet_manager: &mut Option<Rc<RemoteWalletManager>>,
    ) -> Pubkey {
        let token = pubkey_of_signer(arg_matches, "token", wallet_manager).unwrap();
        self.associated_token_address_for_token_or_override(
            arg_matches,
            override_name,
            wallet_manager,
            token,
        )
    }

    // Check if an explicit token account address was provided, otherwise
    // return the associated token address for the default address.
    pub(crate) fn associated_token_address_for_token_or_override(
        &self,
        arg_matches: &ArgMatches,
        override_name: &str,
        wallet_manager: &mut Option<Rc<RemoteWalletManager>>,
        token: Option<Pubkey>,
    ) -> Pubkey {
        if let Some(address) = pubkey_of_signer(arg_matches, override_name, wallet_manager).unwrap()
        {
            return address;
        }

        let token = token.unwrap();
        let owner = self
            .default_address(arg_matches, wallet_manager)
            .unwrap_or_else(|e| {
                eprintln!("error: {}", e);
                panic!();
            });
        get_associated_token_address_with_program_id(&owner, &token, &self.program_id)
    }

    // Checks if an explicit address was provided, otherwise return the default address.
    pub(crate) fn pubkey_or_default(
        &self,
        arg_matches: &ArgMatches,
        address_name: &str,
        wallet_manager: &mut Option<Rc<RemoteWalletManager>>,
    ) -> Pubkey {
        if address_name != "owner" {
            if let Some(address) =
                pubkey_of_signer(arg_matches, address_name, wallet_manager).unwrap()
            {
                return address;
            }
        }

        self.default_address(arg_matches, wallet_manager)
            .unwrap_or_else(|e| {
                eprintln!("error: {}", e);
                panic!();
            })
    }

    // TODO: Implement specifying --owner keypair
    // Checks if an explicit signer was provided, otherwise return the default signer.
    pub(crate) fn signer_or_default(
        &self,
        _arg_matches: &ArgMatches,
        _authority_name: &str,
        _wallet_manager: &mut Option<Rc<RemoteWalletManager>>,
    ) -> (Box<dyn Signer>, Pubkey) {
        // If there are `--multisig-signers` on the command line, allow `NullSigner`s to
        // be returned for multisig account addresses
        // let config = SignerFromPathConfig {
        //     allow_null_signer: !self.multisigner_pubkeys.is_empty(),
        // };
        // TODO:
        // let mut load_authority = move || {
        //     // fallback handled in default_signer() for backward compatibility
        //     // if authority_name != "owner" {
        //     //     if let Some(keypair_path) = arg_matches.value_of(authority_name) {
        //     //         return signer_from_path_with_config(
        //     //             arg_matches,
        //     //             keypair_path,
        //     //             authority_name,
        //     //             wallet_manager,
        //     //             &config,
        //     //         );
        //     //     }
        //     // }

        //     self.default_signer(arg_matches, wallet_manager, &config)
        // };

        let authority = self.get_default_signer();
        let authority_address = authority.pubkey();
        (authority, authority_address)
    }

    fn default_address(
        &self,
        matches: &ArgMatches,
        wallet_manager: &mut Option<Rc<RemoteWalletManager>>,
    ) -> Result<Pubkey, Box<dyn std::error::Error>> {
        // for backwards compatibility, check owner before cli config default
        if let Some(address) = pubkey_of_signer(matches, "owner", wallet_manager).unwrap() {
            return Ok(address);
        }

        Ok(self.get_default_signer().pubkey())
        // match &self.default_keypair {
        //     #[cfg(test)]
        //     KeypairOrPath::Keypair(keypair) => Ok(keypair.pubkey()),
        //     KeypairOrPath::Path(path) => pubkey_from_path(matches, path, "default", wallet_manager),
        // }
    }

    // fn default_signer(
    //     &self,
    //     matches: &ArgMatches,
    //     wallet_manager: &mut Option<Arc<RemoteWalletManager>>,
    //     config: &SignerFromPathConfig,
    // ) -> Result<Box<dyn Signer>, Box<dyn std::error::Error>> {
    //     // for backwards compatibility, check owner before cli config default
    //     if let Some(owner_path) = matches.value_of("owner") {
    //         return signer_from_path_with_config(
    //             matches,
    //             owner_path,
    //             "owner",
    //             wallet_manager,
    //             config,
    //         );
    //     }

    //     Ok(&self.default_signer)

    //     // match &self.default_keypair {
    //     //     #[cfg(test)]
    //     //     KeypairOrPath::Keypair(keypair) => {
    //     //         let cloned = Keypair::from_bytes(&keypair.to_bytes()).unwrap();
    //     //         Ok(Box::new(cloned))
    //     //     }
    //     //     KeypairOrPath::Path(path) => {
    //     //         signer_from_path_with_config(matches, path, "default", wallet_manager, config)
    //     //     }
    //     // }
    // }

    pub(crate) fn get_default_signer(&self) -> Box<dyn Signer> {
        Box::new(Keypair::from_bytes(self.keypair_bytes).unwrap())
    }
}

pub fn get_signer(
    matches: &ArgMatches,
    keypair_name: &str,
    wallet_manager: &mut Option<Rc<RemoteWalletManager>>,
) -> Option<(Box<dyn Signer>, Pubkey)> {
    matches.value_of(keypair_name).map(|path| {
        let signer =
            signer_from_path(matches, path, keypair_name, wallet_manager).unwrap_or_else(|e| {
                eprintln!("error: {}", e);
                panic!();
            });
        let signer_pubkey = signer.pubkey();
        (signer, signer_pubkey)
    })
}

pub fn get_config<'a>(
    matches: &'a ArgMatches,
    endpoint: &str,
    commitment: &str,
    keypair_bytes: &'a [u8],
) -> Config<'a> {
    // TODO:
    // let cli_config = if let Some(&config_file) = matches.value_of("config_file") {
    //     solana_cli_config_wasm::Config::load(&config_file).unwrap_or_else(|_| {
    //         eprintln!("error: Could not find config file `{}`", config_file);
    //         panic!();
    //     })
    // } else {
    //     solana_cli_config_wasm::Config::default()
    // };
    let cli_config = CliConfig::new(endpoint, commitment);

    let json_rpc_url = normalize_to_url_if_moniker(
        matches
            .value_of("json_rpc_url")
            .unwrap_or(&cli_config.json_rpc_url),
    );
    // let websocket_url = CliConfig::compute_websocket_url(&json_rpc_url);

    // TODO:
    // Fee payer is always the client
    // let (signer, fee_payer) = signer_from_path(
    //     matches,
    //     matches
    //         .value_of("fee_payer")
    //         .unwrap_or(&cli_config.keypair_path),
    //     "fee_payer",
    //     &mut wallet_manager,
    // )
    // .map(|s| {
    //     let p = s.pubkey();
    //     (s, p)
    // })
    // .unwrap_or_else(|e| {
    //     eprintln!("error: {}", e);
    //     panic!();
    // });
    // bulk_signers.push(signer);
    let default_signer = Keypair::from_bytes(keypair_bytes).unwrap();
    let fee_payer = default_signer.pubkey();

    let verbose = matches.is_present("verbose");
    let output_format = matches
        .value_of("output_format")
        .map(|value| match value {
            "json" => OutputFormat::Json,
            "json-compact" => OutputFormat::JsonCompact,
            _ => unreachable!(),
        })
        .unwrap_or(if verbose {
            OutputFormat::DisplayVerbose
        } else {
            OutputFormat::Display
        });

    // TODO:
    // let nonce_account = pubkey_of_signer(matches, NONCE_ARG.name, &mut wallet_manager)
    //     .unwrap_or_else(|e| {
    //         eprintln!("error: {}", e);
    //         panic!()
    //     });
    // let nonce_authority = if nonce_account.is_some() {
    //     let (signer, nonce_authority) = signer_from_path(
    //         matches,
    //         matches
    //             .value_of(NONCE_AUTHORITY_ARG.name)
    //             .unwrap_or(&cli_config.keypair_path),
    //         NONCE_AUTHORITY_ARG.name,
    //         &mut wallet_manager,
    //     )
    //     .map(|s| {
    //         let p = s.pubkey();
    //         (s, p)
    //     })
    //     .unwrap_or_else(|e| {
    //         eprintln!("error: {}", e);
    //         panic!();
    //     });
    //     bulk_signers.push(signer);

    //     Some(nonce_authority)
    // } else {
    //     None
    // };
    let nonce_account = None;
    let nonce_authority = None;

    let blockhash_query = blockhash_query_from_matches(matches);
    let sign_only = matches.is_present(SIGN_ONLY_ARG.name);
    // TODO:
    // let dump_transaction_message = matches.is_present(DUMP_TRANSACTION_MESSAGE.name);
    let dump_transaction_message = false;
    let program_id = pubkey_of(matches, "program_id").unwrap();

    // TODO:
    // let multisig_signers = signers_of(matches, MULTISIG_SIGNER_ARG.name, &mut wallet_manager)
    //     .unwrap_or_else(|e| {
    //         eprintln!("error: {}", e);
    //         panic!();
    //     });
    // if let Some(mut multisig_signers) = multisig_signers {
    //     multisig_signers.sort_by(|(_, lp), (_, rp)| lp.cmp(rp));
    //     let (signers, pubkeys): (Vec<_>, Vec<_>) = multisig_signers.into_iter().unzip();
    //     bulk_signers.extend(signers);
    //     multisigner_ids = pubkeys;
    // }
    // let multisigner_pubkeys = multisigner_ids.iter().collect::<Vec<_>>();
    let multisigner_pubkeys = vec![];

    let (_, commitment_config) = ConfigInput::compute_commitment_config(
        matches.value_of("commitment").unwrap_or(""),
        &cli_config.commitment,
    );

    Config {
        rpc_client: Arc::new(WasmClient::new_with_commitment(
            &json_rpc_url,
            commitment_config,
        )),
        // websocket_url,
        output_format,
        keypair_bytes,
        fee_payer,
        nonce_account,
        nonce_authority,
        blockhash_query,
        sign_only,
        dump_transaction_message,
        multisigner_pubkeys,
        program_id,
    }
}
