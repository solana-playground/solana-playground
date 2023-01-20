// Playnet creates a minimal custom runtime to allow testing Solana programs
// in browsers(though not limited to) without restrictions with the help of WASM.
//
// Playnet is not `solana-test-validator`, it's specifically designed for single
// user in mind to consume as little resources as possible.

use std::{rc::Rc, sync::RwLock};

use wasm_bindgen::prelude::*;

use crate::{rpc::PgRpc, runtime::bank::PgBank};

#[wasm_bindgen]
pub struct Playnet {
    /// RPC methods to interact with the Playnet
    #[wasm_bindgen(getter_with_clone)]
    pub rpc: PgRpc,

    /// Reference to the bank
    bank: Rc<RwLock<PgBank>>,
}

#[wasm_bindgen]
impl Playnet {
    /// Playnet lifecycle starts after constructing a Playnet instance
    #[wasm_bindgen(constructor)]
    pub fn new(maybe_bank_string: Option<String>) -> Self {
        // Get WASM errors in console
        console_error_panic_hook::set_once();

        // Create the bank
        let bank = Rc::new(RwLock::new(PgBank::new(maybe_bank_string)));

        Self {
            rpc: PgRpc::new(Rc::clone(&bank)),
            bank: Rc::clone(&bank),
        }
    }

    /// Get the save data necessary to recover from the next time Playnet instance gets created
    #[wasm_bindgen(js_name = getSaveData)]
    pub fn get_save_data(&self) -> String {
        serde_json::to_string(&*self.bank.read().unwrap()).unwrap()
    }
}

#[cfg(test)]
wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);

#[cfg(test)]
pub mod test {
    use std::str::FromStr;

    use solana_sdk::{
        bpf_loader_upgradeable::{self, UpgradeableLoaderState},
        hash::Hash,
        instruction::{AccountMeta, Instruction},
        message::Message,
        native_token::LAMPORTS_PER_SOL,
        packet::PACKET_DATA_SIZE,
        pubkey::Pubkey,
        signature::Keypair,
        signer::Signer,
        signers::Signers,
        system_instruction, system_program,
        transaction::Transaction,
    };
    use wasm_bindgen_test::*;

    use crate::test_programs;

    use super::Playnet;

    /// Tests whether `system_program::transfer` works as expected
    #[test]
    #[wasm_bindgen_test]
    fn transfer() {
        let playnet = Playnet::new(None);

        let sender_kp = get_payer(&playnet);
        let sender_pk = sender_kp.pubkey();

        let receiver_kp = Keypair::new();
        let receiver_pk = receiver_kp.pubkey();

        // Transfer
        let send_amount = 1 * LAMPORTS_PER_SOL;
        let ixs = &[system_instruction::transfer(
            &sender_pk,
            &receiver_pk,
            send_amount,
        )];
        send_tx(ixs, &sender_pk, [&sender_kp], &playnet);

        // Get fee for message
        let fee = playnet
            .rpc
            .get_fee_for_message(
                serde_json::to_string(&Message::new(ixs, Some(&sender_pk)))
                    .unwrap()
                    .as_bytes(),
            )
            .unwrap();

        let sender_balance = playnet
            .rpc
            .get_account_info(&sender_pk.to_string())
            .lamports;
        let receiver_balance = playnet
            .rpc
            .get_account_info(&receiver_pk.to_string())
            .lamports;

        assert_eq!(sender_balance, self::AIRDROP_AMOUNT - (send_amount + fee));
        assert_eq!(receiver_balance, send_amount);
    }

    /// Tests whether "hello world" program works as expected
    #[test]
    #[wasm_bindgen_test]
    fn hello_world() {
        let playnet = Playnet::new(None);

        let owner_kp = get_payer(&playnet);
        let owner_pk = owner_kp.pubkey();

        let program_id = deploy_program(
            test_programs::hello_world::PROGRAM_BYTES,
            &owner_kp,
            &playnet,
        )
        .unwrap();

        let tx_hash = send_tx(
            &[Instruction::new_with_bytes(program_id, &[], vec![])],
            &owner_pk,
            [&owner_kp],
            &playnet,
        );
        let tx = playnet.rpc.get_transaction(&tx_hash);
        let logs = tx.meta().log_messages;
        assert!(logs
            .unwrap()
            .iter()
            .any(|log| log == "Program log: Hello, World!"));
    }

    /// Tests whether CPI works as expected
    #[test]
    #[wasm_bindgen_test]
    fn transfer_cpi() {
        let playnet = Playnet::new(None);

        let owner_kp = get_payer(&playnet);
        let owner_pk = owner_kp.pubkey();

        let receiver_kp = Keypair::new();
        let receiver_pk = receiver_kp.pubkey();

        let program_id = deploy_program(
            test_programs::transfer_cpi::PROGRAM_BYTES,
            &owner_kp,
            &playnet,
        )
        .unwrap();

        let tx_hash = send_tx(
            &[Instruction::new_with_bytes(
                program_id,
                &[],
                vec![
                    AccountMeta {
                        pubkey: owner_pk,
                        is_signer: true,
                        is_writable: true,
                    },
                    AccountMeta {
                        pubkey: receiver_pk,
                        is_signer: false,
                        is_writable: true,
                    },
                    AccountMeta {
                        pubkey: system_program::id(),
                        is_signer: false,
                        is_writable: false,
                    },
                ],
            )],
            &owner_pk,
            [&owner_kp],
            &playnet,
        );

        let tx = playnet.rpc.get_transaction(&tx_hash);

        // Confirm tx was successful
        assert!(tx.meta().err.is_none());

        // Confirm the balance of the receiver
        let receiver_balance = playnet
            .rpc
            .get_account_info(&receiver_pk.to_string())
            .lamports;

        // Program transfers 1 SOL to receiver
        assert_eq!(receiver_balance, 1 * LAMPORTS_PER_SOL);
    }

    const AIRDROP_AMOUNT: u64 = 2 * LAMPORTS_PER_SOL;

    /// Returns a new keypair with `self::AIRDROP_AMOUNT` lamports
    fn get_payer(playnet: &Playnet) -> Keypair {
        let payer_kp = Keypair::new();

        // Request airdrop
        playnet
            .rpc
            .request_airdrop(&payer_kp.pubkey().to_string(), self::AIRDROP_AMOUNT);

        payer_kp
    }

    /// Returns the tx signature
    fn send_tx(
        ixs: &[Instruction],
        payer: &Pubkey,
        signers: impl Signers,
        playnet: &Playnet,
    ) -> String {
        let latest_blockhash =
            Hash::from_str(&playnet.rpc.get_latest_blockhash().blockhash()).unwrap();

        let result = playnet.rpc.send_transaction(
            serde_json::to_string(&Transaction::new_signed_with_payer(
                ixs,
                Some(&payer),
                &signers,
                latest_blockhash,
            ))
            .unwrap()
            .as_bytes(),
        );

        result.tx_hash()
    }

    /// Deploys the program and returns the program id
    fn deploy_program(
        program_bytes: &[u8],
        owner_kp: &Keypair,
        playnet: &Playnet,
    ) -> Result<Pubkey, Box<dyn std::error::Error>> {
        let program_len = program_bytes.len();

        // Create buffer
        let buffer_kp = Keypair::new();
        let buffer_pk = buffer_kp.pubkey();
        let buffer_len = UpgradeableLoaderState::size_of_buffer(program_len);
        let buffer_lamports = playnet
            .rpc
            .get_minimum_balance_for_rent_exemption(buffer_len);

        let owner_pk = owner_kp.pubkey();

        send_tx(
            &bpf_loader_upgradeable::create_buffer(
                &owner_pk,
                &buffer_pk,
                &owner_pk,
                buffer_lamports,
                program_len,
            )?,
            &owner_pk,
            [owner_kp, &buffer_kp],
            playnet,
        );

        // Write to buffer
        let chunk_size = PACKET_DATA_SIZE - 220; // Data with 1 signature
        for (i, bytes) in program_bytes.chunks(chunk_size).enumerate() {
            send_tx(
                &[bpf_loader_upgradeable::write(
                    &buffer_pk,
                    &owner_pk,
                    (i * chunk_size) as u32,
                    bytes.to_vec(),
                )],
                &owner_pk,
                [owner_kp],
                playnet,
            );
        }

        // Deploy
        let program_kp = Keypair::new();
        let program_pk = program_kp.pubkey();
        send_tx(
            &bpf_loader_upgradeable::deploy_with_max_program_len(
                &owner_pk,
                &program_pk,
                &buffer_pk,
                &owner_pk,
                buffer_lamports,
                program_len,
            )?,
            &owner_pk,
            [owner_kp, &program_kp],
            playnet,
        );

        Ok(program_pk)
    }
}
