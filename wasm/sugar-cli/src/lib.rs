mod cli;
mod js;

use clap::Parser;
use solana_playground_utils_wasm::js::PgTerminal;
use wasm_bindgen::prelude::*;

use crate::{cli::*, js::PgSugar};

#[wasm_bindgen(js_name = "runSugar")]
pub async fn run_sugar(cmd: String) {
    let args = cmd.split_ascii_whitespace().collect::<Vec<&str>>();

    match Cli::try_parse_from(args) {
        Ok(cli) => match cli.command {
            Commands::Bundlr { rpc_url, action } => {
                PgSugar::bundlr(
                    rpc_url,
                    match action {
                        BundlrAction::Balance => 0,
                        BundlrAction::Withdraw => 1,
                    },
                )
                .await
            }

            Commands::Collection { command } => match command {
                CollectionSubcommands::Remove {
                    rpc_url,
                    candy_machine,
                } => PgSugar::collection_remove(rpc_url, candy_machine).await,
                CollectionSubcommands::Set {
                    rpc_url,
                    candy_machine,
                    collection_mint,
                } => PgSugar::collection_set(rpc_url, candy_machine, collection_mint).await,
            },

            Commands::CreateConfig { rpc_url } => PgSugar::create_config(rpc_url).await,

            Commands::Deploy { rpc_url } => PgSugar::deploy(rpc_url).await,

            Commands::Freeze { command } => match command {
                FreezeSubcommands::Disable {
                    rpc_url,
                    candy_machine,
                } => PgSugar::freeze_disable(rpc_url, candy_machine).await,
                FreezeSubcommands::Enable {
                    rpc_url,
                    candy_machine,
                    freeze_days,
                } => PgSugar::freeze_enable(rpc_url, candy_machine, freeze_days).await,
            },

            Commands::Hash { compare } => PgSugar::hash(compare).await,

            Commands::Launch {
                rpc_url,
                strict,
                skip_collection_prompt,
            } => PgSugar::launch(rpc_url, strict, skip_collection_prompt).await,

            Commands::Mint {
                rpc_url,
                number,
                receiver,
                candy_machine,
            } => PgSugar::mint(rpc_url, number, receiver, candy_machine).await,

            Commands::Reveal { rpc_url } => PgSugar::reveal(rpc_url).await,

            Commands::Show {
                rpc_url,
                candy_machine,
                unminted,
            } => PgSugar::show(rpc_url, candy_machine, unminted).await,

            Commands::Sign {
                rpc_url,
                mint,
                candy_machine_id,
            } => PgSugar::sign(rpc_url, mint, candy_machine_id).await,

            Commands::Thaw {
                rpc_url,
                all,
                candy_machine,
                nft_mint,
            } => PgSugar::thaw(rpc_url, all, candy_machine, nft_mint).await,

            Commands::UnfreezeFunds {
                rpc_url,
                candy_machine,
            } => PgSugar::unfreeze_funds(rpc_url, candy_machine).await,

            Commands::Update {
                rpc_url,
                new_authority,
                candy_machine,
            } => PgSugar::update(rpc_url, new_authority, candy_machine).await,

            Commands::Upload { rpc_url } => PgSugar::upload(rpc_url).await,

            Commands::Validate {
                strict,
                skip_collection_prompt,
            } => PgSugar::validate(strict, skip_collection_prompt).await,

            Commands::Verify { rpc_url } => PgSugar::verify(rpc_url).await,

            Commands::Withdraw {
                candy_machine,
                rpc_url,
                list,
            } => PgSugar::withdraw(candy_machine, rpc_url, list).await,
        },
        Err(e) => PgTerminal::log_wasm(&e.to_string()),
    }
}
