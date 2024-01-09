use std::rc::Rc;

use clap::{Arg, ArgMatches, Command};
use solana_clap_v3_utils_wasm::input_parsers::{pubkeys_of, value_of};
use solana_cli_output_wasm::cli_output::{
    CliEpochRewardshMetadata, CliInflation, CliKeyedEpochReward, CliKeyedEpochRewards,
};
use solana_client_wasm::WasmClient;
use solana_remote_wallet::remote_wallet::RemoteWalletManager;
use solana_sdk::{clock::Epoch, pubkey::Pubkey, signer::Signer};

use super::stake::{get_epoch_boundary_timestamps, make_cli_reward};
use crate::cli::{CliCommand, CliCommandInfo, CliConfig, CliError, ProcessResult};

#[derive(Debug, PartialEq, Eq)]
pub enum InflationCliCommand {
    Show,
    Rewards(Vec<Pubkey>, Option<Epoch>),
}

pub trait InflationSubCommands {
    fn inflation_subcommands(self) -> Self;
}

impl InflationSubCommands for Command<'_> {
    fn inflation_subcommands(self) -> Self {
        self.subcommand(
            Command::new("inflation")
                .about("Show inflation information")
                .subcommand(
                    Command::new("rewards")
                        .about("Show inflation rewards for a set of addresses")
                        .arg(pubkey!(
                            Arg::new("addresses")
                                .value_name("ADDRESS")
                                .index(1)
                                .multiple_occurrences(true)
                                .required(true),
                            "Address of account to query for rewards. "
                        ))
                        .arg(
                            Arg::new("rewards_epoch")
                                .long("rewards-epoch")
                                .takes_value(true)
                                .value_name("EPOCH")
                                .help("Display rewards for specific epoch [default: latest epoch]"),
                        ),
                ),
        )
    }
}

pub fn parse_inflation_subcommand(
    matches: &ArgMatches,
    _default_signer: Box<dyn Signer>,
    _wallet_manager: &mut Option<Rc<RemoteWalletManager>>,
) -> Result<CliCommandInfo, CliError> {
    let command = match matches.subcommand() {
        Some(("rewards", matches)) => {
            let addresses = pubkeys_of(matches, "addresses").unwrap();
            let rewards_epoch = value_of(matches, "rewards_epoch");
            InflationCliCommand::Rewards(addresses, rewards_epoch)
        }
        _ => InflationCliCommand::Show,
    };
    Ok(CliCommandInfo {
        command: CliCommand::Inflation(command),
        signers: vec![],
    })
}

pub async fn process_inflation_subcommand(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    inflation_subcommand: &InflationCliCommand,
) -> ProcessResult {
    match inflation_subcommand {
        InflationCliCommand::Show => process_show(rpc_client, config).await,
        InflationCliCommand::Rewards(ref addresses, rewards_epoch) => {
            process_rewards(rpc_client, config, addresses, *rewards_epoch).await
        }
    }
}

async fn process_show(rpc_client: &WasmClient, config: &CliConfig<'_>) -> ProcessResult {
    let governor = rpc_client.get_inflation_governor().await?;
    let current_rate = rpc_client.get_inflation_rate().await?;

    let inflation = CliInflation {
        governor,
        current_rate,
    };

    Ok(config.output_format.formatted_string(&inflation))
}

async fn process_rewards(
    rpc_client: &WasmClient,
    config: &CliConfig<'_>,
    addresses: &[Pubkey],
    rewards_epoch: Option<Epoch>,
) -> ProcessResult {
    let rewards = rpc_client
        .get_inflation_reward_with_config(addresses, rewards_epoch)
        .await
        .map_err(|err| {
            if let Some(epoch) = rewards_epoch {
                format!("Rewards not available for epoch {}", epoch)
            } else {
                format!("Rewards not available {}", err)
            }
        })?;
    let epoch_schedule = rpc_client.get_epoch_schedule().await?;

    let mut epoch_rewards: Vec<CliKeyedEpochReward> = vec![];
    let epoch_metadata = if let Some(Some(first_reward)) = rewards.iter().find(|&v| v.is_some()) {
        let (epoch_start_time, epoch_end_time) =
            get_epoch_boundary_timestamps(rpc_client, first_reward, &epoch_schedule).await?;
        for (reward, address) in rewards.iter().zip(addresses) {
            let cli_reward = reward
                .as_ref()
                .and_then(|reward| make_cli_reward(reward, epoch_start_time, epoch_end_time));
            epoch_rewards.push(CliKeyedEpochReward {
                address: address.to_string(),
                reward: cli_reward,
            });
        }
        let block_time = rpc_client
            .get_block_time(first_reward.effective_slot)
            .await?;
        Some(CliEpochRewardshMetadata {
            epoch: first_reward.epoch,
            effective_slot: first_reward.effective_slot,
            block_time,
        })
    } else {
        None
    };
    let cli_rewards = CliKeyedEpochRewards {
        epoch_metadata,
        rewards: epoch_rewards,
    };
    Ok(config.output_format.formatted_string(&cli_rewards))
}
