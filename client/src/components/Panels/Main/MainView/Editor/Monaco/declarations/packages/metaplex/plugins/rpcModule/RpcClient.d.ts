/// <reference types="node" />
import { Buffer } from 'buffer';
import { AccountInfo, Blockhash, BlockhashWithExpiryBlockHeight, Commitment, ConfirmOptions, GetLatestBlockhashConfig, GetProgramAccountsConfig, PublicKey, RpcResponseAndContext, SendOptions, SignatureResult, Transaction, TransactionSignature } from '@solana/web3.js';
import { MetaplexError } from '../../errors';
import type { Metaplex } from '../../Metaplex';
import { Signer, SolAmount, UnparsedAccount, UnparsedMaybeAccount } from '../../types';
import { TransactionBuilder } from '../../utils';
export declare type ConfirmTransactionResponse = RpcResponseAndContext<SignatureResult>;
export declare type SendAndConfirmTransactionResponse = {
    signature: TransactionSignature;
    confirmResponse: ConfirmTransactionResponse;
    blockhash: Blockhash;
    lastValidBlockHeight: number;
};
/**
 * @group Modules
 */
export declare class RpcClient {
    protected readonly metaplex: Metaplex;
    protected defaultFeePayer?: Signer;
    constructor(metaplex: Metaplex);
    protected prepareTransaction(transaction: Transaction | TransactionBuilder, signers: Signer[]): Promise<{
        transaction: Transaction;
        signers: Signer[];
        blockhashWithExpiryBlockHeight: BlockhashWithExpiryBlockHeight;
    }>;
    signTransaction(transaction: Transaction, signers: Signer[]): Promise<Transaction>;
    sendTransaction(transaction: Transaction | TransactionBuilder, sendOptions?: SendOptions, signers?: Signer[]): Promise<TransactionSignature>;
    confirmTransaction(signature: TransactionSignature, blockhashWithExpiryBlockHeight: BlockhashWithExpiryBlockHeight, commitment?: Commitment): Promise<ConfirmTransactionResponse>;
    sendAndConfirmTransaction(transaction: Transaction | TransactionBuilder, confirmOptions?: ConfirmOptions, signers?: Signer[]): Promise<SendAndConfirmTransactionResponse>;
    getAccount(publicKey: PublicKey, commitment?: Commitment): Promise<UnparsedMaybeAccount>;
    accountExists(publicKey: PublicKey, commitment?: Commitment): Promise<boolean>;
    getMultipleAccounts(publicKeys: PublicKey[], commitment?: Commitment): Promise<UnparsedMaybeAccount[]>;
    getProgramAccounts(programId: PublicKey, configOrCommitment?: GetProgramAccountsConfig | Commitment): Promise<UnparsedAccount[]>;
    airdrop(publicKey: PublicKey, amount: SolAmount, commitment?: Commitment): Promise<SendAndConfirmTransactionResponse>;
    getBalance(publicKey: PublicKey, commitment?: Commitment): Promise<SolAmount>;
    getRent(bytes: number, commitment?: Commitment): Promise<SolAmount>;
    getLatestBlockhash(commitmentOrConfig?: Commitment | GetLatestBlockhashConfig): Promise<BlockhashWithExpiryBlockHeight>;
    getSolanaExporerUrl(signature: string): string;
    setDefaultFeePayer(payer: Signer): this;
    getDefaultFeePayer(): Signer;
    protected getUnparsedMaybeAccount(publicKey: PublicKey, accountInfo: AccountInfo<Buffer> | null): UnparsedMaybeAccount;
    protected parseProgramError(error: unknown, transaction: Transaction): MetaplexError;
}
