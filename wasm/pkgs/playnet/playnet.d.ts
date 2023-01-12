/* tslint:disable */
/* eslint-disable */
/**
* Initialize Javascript logging and panic handler
*/
export function solana_program_init(): void;
/**
*/
export enum WasmCommitmentLevel {
  Processed,
  Confirmed,
  Finalized,
}
/**
* Metadata for a confirmed transaction on the ledger
*/
export class ConfirmedTransactionMeta {
  free(): void;
/**
* @returns {bigint}
*/
  fee(): bigint;
/**
* TODO:
* @returns {number | undefined}
*/
  innerInstructions(): number | undefined;
/**
* @returns {BigUint64Array}
*/
  preBalances(): BigUint64Array;
/**
* @returns {BigUint64Array}
*/
  postBalances(): BigUint64Array;
/**
* @returns {any[] | undefined}
*/
  logs(): any[] | undefined;
/**
* TODO:
* @returns {number | undefined}
*/
  preTokenBalances(): number | undefined;
/**
* TODO:
* @returns {number | undefined}
*/
  postTokenBalances(): number | undefined;
/**
* @returns {string | undefined}
*/
  err(): string | undefined;
/**
* TODO:
* @returns {number | undefined}
*/
  loadedAddresses(): number | undefined;
/**
* @returns {bigint | undefined}
*/
  computeUnitsConsumed(): bigint | undefined;
}
/**
*/
export class GetLatestBlockhashResult {
  free(): void;
/**
* @returns {string}
*/
  blockhash(): string;
/**
* @returns {bigint}
*/
  lastValidBlockHeight(): bigint;
}
/**
*/
export class GetSignatureStatusesResult {
  free(): void;
/**
* @returns {any[]}
*/
  statuses(): any[];
}
/**
*/
export class GetTransactionResult {
  free(): void;
/**
* NOTE: This method should be called before accessing any other data
* @returns {boolean}
*/
  exists(): boolean;
/**
* @returns {bigint | undefined}
*/
  blockTime(): bigint | undefined;
/**
* Returns the transaction version or `None` for legacy transactions
* @returns {number | undefined}
*/
  version(): number | undefined;
/**
* @returns {ConfirmedTransactionMeta}
*/
  meta(): ConfirmedTransactionMeta;
/**
* Returns the base64 encoded tx string
* @returns {string}
*/
  transaction(): string;
}
/**
* A hash; the 32-byte output of a hashing algorithm.
*
* This struct is used most often in `solana-sdk` and related crates to contain
* a [SHA-256] hash, but may instead contain a [blake3] hash, as created by the
* [`blake3`] module (and used in [`Message::hash`]).
*
* [SHA-256]: https://en.wikipedia.org/wiki/SHA-2
* [blake3]: https://github.com/BLAKE3-team/BLAKE3
* [`blake3`]: crate::blake3
* [`Message::hash`]: crate::message::Message::hash
*/
export class Hash {
  free(): void;
/**
* Create a new Hash object
*
* * `value` - optional hash as a base58 encoded string, `Uint8Array`, `[number]`
* @param {any} value
*/
  constructor(value: any);
/**
* Return the base58 string representation of the hash
* @returns {string}
*/
  toString(): string;
/**
* Checks if two `Hash`s are equal
* @param {Hash} other
* @returns {boolean}
*/
  equals(other: Hash): boolean;
/**
* Return the `Uint8Array` representation of the hash
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
}
/**
* A directive for a single invocation of a Solana program.
*
* An instruction specifies which program it is calling, which accounts it may
* read or modify, and additional data that serves as input to the program. One
* or more instructions are included in transactions submitted by Solana
* clients. Instructions are also used to describe [cross-program
* invocations][cpi].
*
* [cpi]: https://docs.solana.com/developing/programming-model/calling-between-programs
*
* During execution, a program will receive a list of account data as one of
* its arguments, in the same order as specified during `Instruction`
* construction.
*
* While Solana is agnostic to the format of the instruction data, it has
* built-in support for serialization via [`borsh`] and [`bincode`].
*
* [`borsh`]: https://docs.rs/borsh/latest/borsh/
* [`bincode`]: https://docs.rs/bincode/latest/bincode/
*
* # Specifying account metadata
*
* When constructing an [`Instruction`], a list of all accounts that may be
* read or written during the execution of that instruction must be supplied as
* [`AccountMeta`] values.
*
* Any account whose data may be mutated by the program during execution must
* be specified as writable. During execution, writing to an account that was
* not specified as writable will cause the transaction to fail. Writing to an
* account that is not owned by the program will cause the transaction to fail.
*
* Any account whose lamport balance may be mutated by the program during
* execution must be specified as writable. During execution, mutating the
* lamports of an account that was not specified as writable will cause the
* transaction to fail. While _subtracting_ lamports from an account not owned
* by the program will cause the transaction to fail, _adding_ lamports to any
* account is allowed, as long is it is mutable.
*
* Accounts that are not read or written by the program may still be specified
* in an `Instruction`'s account list. These will affect scheduling of program
* execution by the runtime, but will otherwise be ignored.
*
* When building a transaction, the Solana runtime coalesces all accounts used
* by all instructions in that transaction, along with accounts and permissions
* required by the runtime, into a single account list. Some accounts and
* account permissions required by the runtime to process a transaction are
* _not_ required to be included in an `Instruction`s account list. These
* include:
*
* - The program ID &mdash; it is a separate field of `Instruction`
* - The transaction's fee-paying account &mdash; it is added during [`Message`]
*   construction. A program may still require the fee payer as part of the
*   account list if it directly references it.
*
* [`Message`]: crate::message::Message
*
* Programs may require signatures from some accounts, in which case they
* should be specified as signers during `Instruction` construction. The
* program must still validate during execution that the account is a signer.
*/
export class Instruction {
  free(): void;
}
/**
*/
export class Instructions {
  free(): void;
/**
*/
  constructor();
/**
* @param {Instruction} instruction
*/
  push(instruction: Instruction): void;
}
/**
* A vanilla Ed25519 key pair
*/
export class Keypair {
  free(): void;
/**
* Create a new `Keypair `
*/
  constructor();
/**
* Convert a `Keypair` to a `Uint8Array`
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
/**
* Recover a `Keypair` from a `Uint8Array`
* @param {Uint8Array} bytes
* @returns {Keypair}
*/
  static fromBytes(bytes: Uint8Array): Keypair;
/**
* Return the `Pubkey` for this `Keypair`
* @returns {Pubkey}
*/
  pubkey(): Pubkey;
}
/**
* A Solana transaction message (legacy).
*
* See the [`message`] module documentation for further description.
*
* [`message`]: crate::message
*
* Some constructors accept an optional `payer`, the account responsible for
* paying the cost of executing a transaction. In most cases, callers should
* specify the payer explicitly in these constructors. In some cases though,
* the caller is not _required_ to specify the payer, but is still allowed to:
* in the `Message` structure, the first account is always the fee-payer, so if
* the caller has knowledge that the first account of the constructed
* transaction's `Message` is both a signer and the expected fee-payer, then
* redundantly specifying the fee-payer is not strictly required.
*/
export class Message {
  free(): void;
/**
* The id of a recent ledger entry.
*/
  recent_blockhash: Hash;
}
/**
*/
export class PgRpc {
  free(): void;
/**
* @param {string} pubkey_str
* @returns {WasmAccount}
*/
  getAccountInfo(pubkey_str: string): WasmAccount;
/**
* @returns {bigint}
*/
  getSlot(): bigint;
/**
* @returns {bigint}
*/
  getBlockHeight(): bigint;
/**
* @returns {string}
*/
  getGenesisHash(): string;
/**
* @returns {GetLatestBlockhashResult}
*/
  getLatestBlockhash(): GetLatestBlockhashResult;
/**
* @param {number} data_len
* @returns {bigint}
*/
  getMinimumBalanceForRentExemption(data_len: number): bigint;
/**
* @param {Uint8Array} serialized_msg
* @returns {bigint | undefined}
*/
  getFeeForMessage(serialized_msg: Uint8Array): bigint | undefined;
/**
* @param {Uint8Array} serialized_tx
* @returns {SimulateTransactionResult}
*/
  simulateTransaction(serialized_tx: Uint8Array): SimulateTransactionResult;
/**
* @param {Uint8Array} serialized_tx
* @returns {SendTransactionResult}
*/
  sendTransaction(serialized_tx: Uint8Array): SendTransactionResult;
/**
* @param {any[]} signatures
* @returns {GetSignatureStatusesResult}
*/
  getSignatureStatuses(signatures: any[]): GetSignatureStatusesResult;
/**
* @param {string} signature_str
* @returns {GetTransactionResult}
*/
  getTransaction(signature_str: string): GetTransactionResult;
/**
* @param {string} pubkey_str
* @param {bigint} lamports
* @returns {SendTransactionResult}
*/
  requestAirdrop(pubkey_str: string, lamports: bigint): SendTransactionResult;
}
/**
*/
export class Playnet {
  free(): void;
/**
* Playnet lifecycle starts after constructing a Playnet instance
* @param {string | undefined} maybe_bank_string
*/
  constructor(maybe_bank_string?: string);
/**
* Get the save data necessary to recover from the next time Playnet instance gets created
* @returns {string}
*/
  getSaveData(): string;
/**
* RPC methods to interact with the Playnet
*/
  rpc: PgRpc;
}
/**
* The address of a [Solana account][acc].
*
* Some account addresses are [ed25519] public keys, with corresponding secret
* keys that are managed off-chain. Often, though, account addresses do not
* have corresponding secret keys &mdash; as with [_program derived
* addresses_][pdas] &mdash; or the secret key is not relevant to the operation
* of a program, and may have even been disposed of. As running Solana programs
* can not safely create or manage secret keys, the full [`Keypair`] is not
* defined in `solana-program` but in `solana-sdk`.
*
* [acc]: https://docs.solana.com/developing/programming-model/accounts
* [ed25519]: https://ed25519.cr.yp.to/
* [pdas]: https://docs.solana.com/developing/programming-model/calling-between-programs#program-derived-addresses
* [`Keypair`]: https://docs.rs/solana-sdk/latest/solana_sdk/signer/keypair/struct.Keypair.html
*/
export class Pubkey {
  free(): void;
/**
* Create a new Pubkey object
*
* * `value` - optional public key as a base58 encoded string, `Uint8Array`, `[number]`
* @param {any} value
*/
  constructor(value: any);
/**
* Return the base58 string representation of the public key
* @returns {string}
*/
  toString(): string;
/**
* Check if a `Pubkey` is on the ed25519 curve.
* @returns {boolean}
*/
  isOnCurve(): boolean;
/**
* Checks if two `Pubkey`s are equal
* @param {Pubkey} other
* @returns {boolean}
*/
  equals(other: Pubkey): boolean;
/**
* Return the `Uint8Array` representation of the public key
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
/**
* Derive a Pubkey from another Pubkey, string seed, and a program id
* @param {Pubkey} base
* @param {string} seed
* @param {Pubkey} owner
* @returns {Pubkey}
*/
  static createWithSeed(base: Pubkey, seed: string, owner: Pubkey): Pubkey;
/**
* Derive a program address from seeds and a program id
* @param {any[]} seeds
* @param {Pubkey} program_id
* @returns {Pubkey}
*/
  static createProgramAddress(seeds: any[], program_id: Pubkey): Pubkey;
/**
* Find a valid program address
*
* Returns:
* * `[PubKey, number]` - the program address and bump seed
* @param {any[]} seeds
* @param {Pubkey} program_id
* @returns {any}
*/
  static findProgramAddress(seeds: any[], program_id: Pubkey): any;
}
/**
*/
export class SendTransactionResult {
  free(): void;
/**
* @returns {string | undefined}
*/
  error(): string | undefined;
/**
* @returns {string}
*/
  txHash(): string;
}
/**
*/
export class SimulateTransactionResult {
  free(): void;
/**
* @returns {string | undefined}
*/
  error(): string | undefined;
/**
* @returns {any[]}
*/
  logs(): any[];
/**
* @returns {bigint}
*/
  unitsConsumed(): bigint;
/**
* @returns {WasmTransactionReturnData | undefined}
*/
  returnData(): WasmTransactionReturnData | undefined;
}
/**
* An atomically-commited sequence of instructions.
*
* While [`Instruction`]s are the basic unit of computation in Solana,
* they are submitted by clients in [`Transaction`]s containing one or
* more instructions, and signed by one or more [`Signer`]s.
*
* [`Signer`]: crate::signer::Signer
*
* See the [module documentation] for more details about transactions.
*
* [module documentation]: self
*
* Some constructors accept an optional `payer`, the account responsible for
* paying the cost of executing a transaction. In most cases, callers should
* specify the payer explicitly in these constructors. In some cases though,
* the caller is not _required_ to specify the payer, but is still allowed to:
* in the [`Message`] structure, the first account is always the fee-payer, so
* if the caller has knowledge that the first account of the constructed
* transaction's `Message` is both a signer and the expected fee-payer, then
* redundantly specifying the fee-payer is not strictly required.
*/
export class Transaction {
  free(): void;
/**
* Create a new `Transaction`
* @param {Instructions} instructions
* @param {Pubkey | undefined} payer
*/
  constructor(instructions: Instructions, payer?: Pubkey);
/**
* Return a message containing all data that should be signed.
* @returns {Message}
*/
  message(): Message;
/**
* Return the serialized message data to sign.
* @returns {Uint8Array}
*/
  messageData(): Uint8Array;
/**
* Verify the transaction
*/
  verify(): void;
/**
* @param {Keypair} keypair
* @param {Hash} recent_blockhash
*/
  partialSign(keypair: Keypair, recent_blockhash: Hash): void;
/**
* @returns {boolean}
*/
  isSigned(): boolean;
/**
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
/**
* @param {Uint8Array} bytes
* @returns {Transaction}
*/
  static fromBytes(bytes: Uint8Array): Transaction;
}
/**
*/
export class TransactionStatus {
  free(): void;
/**
* @returns {string | undefined}
*/
  error(): string | undefined;
/**
*/
  confirmationStatus?: number;
/**
*/
  confirmations?: number;
/**
*/
  slot: bigint;
}
/**
*/
export class WasmAccount {
  free(): void;
/**
* Data held in this account
*/
  data: Uint8Array;
/**
* This account's data contains a loaded program (and is now read-only)
*/
  executable: boolean;
/**
* Lamports in the account
*/
  lamports: bigint;
/**
* The program that owns this account. If executable, the program that loads this account.
*/
  owner: Pubkey;
/**
* The epoch at which this account will next owe rent
*/
  rentEpoch: bigint;
}
/**
* Return data at the end of a transaction
*/
export class WasmTransactionReturnData {
  free(): void;
/**
*/
  data: Uint8Array;
/**
*/
  programId: Pubkey;
}
