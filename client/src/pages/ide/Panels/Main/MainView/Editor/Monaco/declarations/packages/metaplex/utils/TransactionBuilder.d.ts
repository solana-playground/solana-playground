import { BlockhashWithExpiryBlockHeight, ConfirmOptions, SignaturePubkeyPair, Transaction, TransactionInstruction } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../plugins/rpcModule';
import type { Metaplex } from '../Metaplex';
import type { OperationOptions, Signer } from '../types';
export declare type InstructionWithSigners = {
    instruction: TransactionInstruction;
    signers: Signer[];
    key?: string;
};
declare type TransactionOptions = {
    /** Additional signatures. */
    signatures?: Array<SignaturePubkeyPair>;
};
export declare type TransactionBuilderOptions = Pick<OperationOptions, 'programs' | 'payer'>;
export declare class TransactionBuilder<C extends object = object> {
    /** The list of all instructions and their respective signers. */
    protected records: InstructionWithSigners[];
    /** Options used when building the transaction. */
    protected transactionOptions: TransactionOptions;
    /** The signer to use to pay for transaction fees. */
    protected feePayer: Signer | undefined;
    /** Any additional context gathered when creating the transaction builder. */
    protected context: C;
    constructor(transactionOptions?: TransactionOptions);
    static make<C extends object = object>(transactionOptions?: TransactionOptions): TransactionBuilder<C>;
    prepend(...txs: (InstructionWithSigners | TransactionBuilder)[]): TransactionBuilder<C>;
    append(...txs: (InstructionWithSigners | TransactionBuilder)[]): TransactionBuilder<C>;
    add(...txs: (InstructionWithSigners | TransactionBuilder)[]): TransactionBuilder<C>;
    splitUsingKey(key: string, include?: boolean): [TransactionBuilder, TransactionBuilder];
    splitBeforeKey(key: string): [TransactionBuilder, TransactionBuilder];
    splitAfterKey(key: string): [TransactionBuilder, TransactionBuilder];
    getInstructionsWithSigners(): InstructionWithSigners[];
    getInstructions(): TransactionInstruction[];
    getInstructionCount(): number;
    isEmpty(): boolean;
    getSigners(): Signer[];
    setTransactionOptions(transactionOptions: TransactionOptions): TransactionBuilder<C>;
    getTransactionOptions(): TransactionOptions | undefined;
    setFeePayer(feePayer: Signer): TransactionBuilder<C>;
    getFeePayer(): Signer | undefined;
    setContext(context: C): TransactionBuilder<C>;
    getContext(): C;
    when(condition: boolean, callback: (tx: TransactionBuilder<C>) => TransactionBuilder<C>): TransactionBuilder<C>;
    unless(condition: boolean, callback: (tx: TransactionBuilder<C>) => TransactionBuilder<C>): TransactionBuilder<C>;
    toTransaction(blockhashWithExpiryBlockHeight: BlockhashWithExpiryBlockHeight, options?: TransactionOptions): Transaction;
    sendAndConfirm(metaplex: Metaplex, confirmOptions?: ConfirmOptions): Promise<{
        response: SendAndConfirmTransactionResponse;
    } & C>;
}
export {};
