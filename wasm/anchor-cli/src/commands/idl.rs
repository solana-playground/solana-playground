use std::io::{Read, Write};

use anchor_lang::{
    idl::{IdlAccount, IdlInstruction, ERASED_AUTHORITY},
    prelude::AccountMeta,
    AccountDeserialize, AnchorDeserialize, AnchorSerialize,
};
use anchor_syn::idl::types::Idl;
use anyhow::anyhow;
use clap::Parser;
use flate2::{read::ZlibDecoder, write::ZlibEncoder, Compression};
use solana_playground_utils_wasm::js::PgTerminal;
use solana_sdk::{
    instruction::Instruction, pubkey::Pubkey, signer::keypair::Keypair, signer::Signer,
    system_program, sysvar, transaction::Transaction,
};

use crate::{
    cli::CliResult,
    utils::{get_client, get_idl, get_keypair, get_program_id},
};

#[derive(Parser)]
pub enum IdlCommand {
    /// Outputs the authority for the IDL account.
    Authority {
        /// The program to view.
        program_id: Option<Pubkey>,
    },
    /// Close the IDL account.
    Close { program_id: Option<Pubkey> },
    /// Command to remove the ability to modify the IDL account. This should
    /// likely be used in conjection with eliminating an "upgrade authority" on
    /// the program.
    EraseAuthority {
        #[clap(short, long)]
        program_id: Option<Pubkey>,
    },
    /// Fetches an IDL for the given address from a cluster.
    /// The address can be a program, IDL account, or IDL buffer.
    Fetch { address: Option<Pubkey> },
    /// Initializes a program's IDL account. Can only be run once.
    Init { program_id: Option<Pubkey> },
    /// Sets a new authority on the IDL account.
    SetAuthority {
        /// Program to change the IDL authority.
        #[clap(short, long)]
        program_id: Option<Pubkey>,
        /// The IDL account buffer to set the authority of. If none is given,
        /// then the canonical IDL account is used.
        address: Option<Pubkey>,
        /// New authority of the IDL account.
        #[clap(short, long)]
        new_authority: Pubkey,
    },
    /// Sets a new IDL buffer for the program.
    SetBuffer {
        program_id: Option<Pubkey>,
        /// Address of the buffer account to set as the idl on the program.
        #[clap(short, long)]
        buffer: Pubkey,
    },
    /// Upgrades the IDL to the new file. An alias for first writing and then
    /// then setting the idl buffer account.
    Upgrade { program_id: Option<Pubkey> },
    /// Writes an IDL into a buffer account. This can be used with SetBuffer
    /// to perform an upgrade.
    WriteBuffer { program_id: Option<Pubkey> },
}

pub async fn process_idl(cmd: IdlCommand) -> CliResult {
    match cmd {
        IdlCommand::Authority { program_id } => process_authority(program_id).await,
        IdlCommand::Close { program_id } => process_close(program_id).await,
        IdlCommand::EraseAuthority { program_id } => process_erase_authority(program_id).await,
        IdlCommand::Fetch { address } => process_fetch(address).await,
        IdlCommand::Init { program_id } => process_init(program_id).await,
        IdlCommand::SetAuthority {
            program_id,
            address,
            new_authority,
        } => process_set_authority(program_id, address, new_authority).await,
        IdlCommand::SetBuffer { program_id, buffer } => {
            process_set_buffer(program_id, buffer).await
        }
        IdlCommand::Upgrade { program_id } => process_upgrade(program_id).await,
        IdlCommand::WriteBuffer { program_id } => process_write_buffer(program_id).await,
    }
}

async fn process_authority(program_id: Option<Pubkey>) -> CliResult {
    let program_id = get_program_id(program_id)?;

    let client = get_client();
    let idl_address = {
        let account = client.get_account(&program_id).await?;
        if account.executable {
            IdlAccount::address(&program_id)
        } else {
            program_id
        }
    };

    let account = client.get_account(&idl_address).await?;
    let mut data: &[u8] = &account.data;
    let idl_account: IdlAccount = AccountDeserialize::try_deserialize(&mut data)?;

    PgTerminal::log_wasm(&format!("{}", idl_account.authority));

    Ok(())
}

async fn process_close(program_id: Option<Pubkey>) -> CliResult {
    let program_id = get_program_id(program_id)?;
    let idl_address = IdlAccount::address(&program_id);

    let keypair = get_keypair();
    let client = get_client();

    // Instruction accounts
    let accounts = vec![
        AccountMeta::new(idl_address, false),
        AccountMeta::new_readonly(keypair.pubkey(), true),
        AccountMeta::new(keypair.pubkey(), true),
    ];

    // Instruction
    let ix = Instruction {
        program_id,
        accounts,
        data: { serialize_idl_ix(anchor_lang::idl::IdlInstruction::Close {})? },
    };

    // Send transaction
    let latest_hash = client.get_latest_blockhash().await?;
    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&keypair.pubkey()),
        &[&keypair],
        latest_hash,
    );
    client.send_and_confirm_transaction(&tx).await?;

    PgTerminal::log_wasm(&format!("IDL account closed: {}", idl_address));

    Ok(())
}

async fn process_erase_authority(program_id: Option<Pubkey>) -> CliResult {
    process_set_authority(program_id, None, ERASED_AUTHORITY).await
}

async fn process_fetch(addr: Option<Pubkey>) -> CliResult {
    let addr = get_program_id(addr)?;
    let client = get_client();

    let mut account = client.get_account(&addr).await?;

    if account.executable {
        let addr = IdlAccount::address(&addr);
        account = client.get_account(&addr).await?
    }

    // Cut off account discriminator
    let mut data = &account.data[8..];
    let idl_account: IdlAccount = AnchorDeserialize::deserialize(&mut data)?;

    let compressed_len: usize = idl_account.data_len.try_into().unwrap();
    let compressed_bytes = &account.data[44..44 + compressed_len];
    let mut z = ZlibDecoder::new(compressed_bytes);
    let mut s = Vec::new();
    z.read_to_end(&mut s)?;
    let idl: Idl = serde_json::from_slice(&s[..])?;

    let idl_string = serde_json::to_string_pretty(&idl)?;
    PgTerminal::log_wasm(&idl_string);

    Ok(())
}

async fn process_init(program_id: Option<Pubkey>) -> CliResult {
    let program_id = get_program_id(program_id)?;
    let idl = get_idl()?;
    let idl_address = IdlAccount::address(&program_id);
    let idl_data = serialize_idl(&idl)?;

    let keypair = get_keypair();
    let client = get_client();

    // Run `Create instruction
    {
        let pda_max_growth = 60_000;
        let idl_header_size = 44;
        let idl_data_len = idl_data.len() as u64;
        // We're only going to support up to 6 instructions in one transaction
        // because will anyone really have a >60kb IDL?
        if idl_data_len > pda_max_growth {
            return Err(anyhow!(
                "Your IDL is over 60kb and this isn't supported right now"
            ));
        }
        // Double for future growth
        let data_len = (idl_data_len * 2).min(pda_max_growth - idl_header_size);

        let num_additional_instructions = data_len / 10000;
        let mut instructions = Vec::new();
        let data = serialize_idl_ix(anchor_lang::idl::IdlInstruction::Create { data_len })?;
        let program_signer = Pubkey::find_program_address(&[], &program_id).0;
        let accounts = vec![
            AccountMeta::new_readonly(keypair.pubkey(), true),
            AccountMeta::new(idl_address, false),
            AccountMeta::new_readonly(program_signer, false),
            AccountMeta::new_readonly(system_program::ID, false),
            AccountMeta::new_readonly(program_id, false),
            AccountMeta::new_readonly(sysvar::rent::ID, false),
        ];
        instructions.push(Instruction {
            program_id,
            accounts,
            data,
        });

        for _ in 0..num_additional_instructions {
            let data = serialize_idl_ix(anchor_lang::idl::IdlInstruction::Resize { data_len })?;
            instructions.push(Instruction {
                program_id,
                accounts: vec![
                    AccountMeta::new(idl_address, false),
                    AccountMeta::new_readonly(keypair.pubkey(), true),
                    AccountMeta::new_readonly(system_program::ID, false),
                ],
                data,
            });
        }

        let latest_hash = client.get_latest_blockhash().await?;
        let tx = Transaction::new_signed_with_payer(
            &instructions,
            Some(&keypair.pubkey()),
            &[&keypair],
            latest_hash,
        );
        client.send_and_confirm_transaction(&tx).await?;
    }

    // Write directly to the IDL account buffer
    idl_write(program_id, &idl, IdlAccount::address(&program_id)).await?;

    PgTerminal::log_wasm(&format!("IDL account created: {}", idl_address));

    Ok(())
}

async fn process_set_authority(
    program_id: Option<Pubkey>,
    idl_address: Option<Pubkey>,
    new_authority: Pubkey,
) -> CliResult {
    let program_id = get_program_id(program_id)?;
    let idl_address = idl_address.unwrap_or(IdlAccount::address(&program_id));

    let keypair = get_keypair();
    let client = get_client();

    // Instruction data
    let data = serialize_idl_ix(anchor_lang::idl::IdlInstruction::SetAuthority { new_authority })?;

    // Instruction accounts
    let accounts = vec![
        AccountMeta::new(idl_address, false),
        AccountMeta::new_readonly(keypair.pubkey(), true),
    ];

    // Instruction
    let ix = Instruction {
        program_id,
        accounts,
        data,
    };

    // Send transaction
    let latest_hash = client.get_latest_blockhash().await?;
    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&keypair.pubkey()),
        &[&keypair],
        latest_hash,
    );
    client.send_and_confirm_transaction(&tx).await?;

    if new_authority == ERASED_AUTHORITY {
        PgTerminal::log_wasm("Erased authority.");
    } else {
        PgTerminal::log_wasm(&format!("Set authority to: {}", new_authority));
    }

    Ok(())
}

async fn process_set_buffer(program_id: Option<Pubkey>, buffer: Pubkey) -> CliResult {
    let program_id = get_program_id(program_id)?;

    let keypair = get_keypair();
    let client = get_client();

    // Instruction to set the buffer onto the IdlAccount
    let set_buffer_ix = {
        let accounts = vec![
            AccountMeta::new(buffer, false),
            AccountMeta::new(IdlAccount::address(&program_id), false),
            AccountMeta::new(keypair.pubkey(), true),
        ];
        let mut data = anchor_lang::idl::IDL_IX_TAG.to_le_bytes().to_vec();
        data.append(&mut IdlInstruction::SetBuffer.try_to_vec()?);
        Instruction {
            program_id,
            accounts,
            data,
        }
    };

    // Build the transaction
    let latest_hash = client.get_latest_blockhash().await?;
    let tx = Transaction::new_signed_with_payer(
        &[set_buffer_ix],
        Some(&keypair.pubkey()),
        &[&keypair],
        latest_hash,
    );

    // Send the transaction
    client.send_and_confirm_transaction(&tx).await?;

    Ok(())
}

async fn process_upgrade(program_id: Option<Pubkey>) -> CliResult {
    let program_id = get_program_id(program_id)?;
    let buffer_pk = create_and_write_buffer(program_id).await?;
    process_set_buffer(Some(program_id), buffer_pk).await
}

async fn process_write_buffer(program_id: Option<Pubkey>) -> CliResult {
    let program_id = get_program_id(program_id)?;
    create_and_write_buffer(program_id).await?;
    Ok(())
}

/// Write the idl to the account buffer, chopping up the IDL into pieces and sending multiple
/// transactions in the event the IDL doesn't fit into a single transaction
async fn idl_write(program_id: Pubkey, idl: &Idl, idl_address: Pubkey) -> CliResult {
    let keypair = get_keypair();
    let client = get_client();

    // Remove the metadata before deploy
    let mut idl = idl.clone();
    idl.metadata = None;

    // Serialize and compress the idl
    let idl_data = {
        let json_bytes = serde_json::to_vec(&idl)?;
        let mut e = ZlibEncoder::new(Vec::new(), Compression::default());
        e.write_all(&json_bytes)?;
        e.finish()?
    };

    const MAX_WRITE_SIZE: usize = 1000;
    let mut offset = 0;
    while offset < idl_data.len() {
        // Instruction data
        let data = {
            let start = offset;
            let end = std::cmp::min(offset + MAX_WRITE_SIZE, idl_data.len());
            serialize_idl_ix(anchor_lang::idl::IdlInstruction::Write {
                data: idl_data[start..end].to_vec(),
            })?
        };
        // Instruction accounts
        let accounts = vec![
            AccountMeta::new(idl_address, false),
            AccountMeta::new_readonly(keypair.pubkey(), true),
        ];
        // Instruction
        let ix = Instruction {
            program_id,
            accounts,
            data,
        };
        // Send transaction
        let latest_hash = client.get_latest_blockhash().await?;
        let tx = Transaction::new_signed_with_payer(
            &[ix],
            Some(&keypair.pubkey()),
            &[&keypair],
            latest_hash,
        );
        client.send_and_confirm_transaction(&tx).await?;
        offset += MAX_WRITE_SIZE;
    }
    Ok(())
}

/// Serialize and compress the idl
fn serialize_idl(idl: &Idl) -> CliResult<Vec<u8>> {
    let json_bytes = serde_json::to_vec(idl)?;
    let mut e = ZlibEncoder::new(Vec::new(), Compression::default());
    e.write_all(&json_bytes)?;
    e.finish().map_err(Into::into)
}

fn serialize_idl_ix(ix_inner: anchor_lang::idl::IdlInstruction) -> CliResult<Vec<u8>> {
    let mut data = anchor_lang::idl::IDL_IX_TAG.to_le_bytes().to_vec();
    data.append(&mut ix_inner.try_to_vec()?);
    Ok(data)
}

async fn create_and_write_buffer(program_id: Pubkey) -> CliResult<Pubkey> {
    let idl = get_idl()?;
    let keypair = get_keypair();
    let client = get_client();

    let buffer_kp = Keypair::new();
    let buffer_pk = buffer_kp.pubkey();

    // Creates the new buffer account with the system program
    let create_account_ix = {
        let space = 8 + 32 + 4 + serialize_idl(&idl)?.len();
        let lamports = client.get_minimum_balance_for_rent_exemption(space).await?;
        solana_sdk::system_instruction::create_account(
            &keypair.pubkey(),
            &buffer_pk,
            lamports,
            space as u64,
            &program_id,
        )
    };

    // Program instruction to create the buffer
    let create_buffer_ix = {
        let accounts = vec![
            AccountMeta::new(buffer_pk, false),
            AccountMeta::new_readonly(keypair.pubkey(), true),
            AccountMeta::new_readonly(sysvar::rent::ID, false),
        ];
        let mut data = anchor_lang::idl::IDL_IX_TAG.to_le_bytes().to_vec();
        data.append(&mut IdlInstruction::CreateBuffer.try_to_vec()?);
        Instruction {
            program_id,
            accounts,
            data,
        }
    };

    // Build the transaction
    let latest_hash = client.get_latest_blockhash().await?;
    let tx = Transaction::new_signed_with_payer(
        &[create_account_ix, create_buffer_ix],
        Some(&keypair.pubkey()),
        &[&keypair, &buffer_kp],
        latest_hash,
    );

    // Send the transaction
    client.send_and_confirm_transaction(&tx).await?;

    idl_write(program_id, &idl, buffer_pk).await?;

    PgTerminal::log_wasm(&format!("IDL buffer created: {}", buffer_pk));

    Ok(buffer_pk)
}
