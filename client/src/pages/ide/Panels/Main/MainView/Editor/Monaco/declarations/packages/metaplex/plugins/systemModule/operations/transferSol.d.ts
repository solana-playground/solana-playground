import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import type { Metaplex } from '../../../Metaplex';
import { Operation, OperationHandler, Signer, SolAmount } from '../../../types';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
declare const Key: "TransferSolOperation";
/**
 * Transfers some SOL from one account to another.
 *
 * ```ts
 * await metaplex
 *   .system()
 *   .transferSol({
 *     to: new PublicKey("..."),
 *     amount: sol(1.5),
 *   };
 * ````
 *
 * @group Operations
 * @category Constructors
 */
export declare const transferSolOperation: import("../../../types").OperationConstructor<TransferSolOperation, "TransferSolOperation", TransferSolInput, TransferSolOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type TransferSolOperation = Operation<typeof Key, TransferSolInput, TransferSolOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type TransferSolInput = {
    /**
     * The account that sends the SOLs as a Signer.
     *
     * @defaultValue `metaplex.identity()`
     */
    from?: Signer;
    /** The address of the account that receives the SOLs. */
    to: PublicKey;
    /** The amount of SOLs to send. */
    amount: SolAmount;
    /**
     * Base public key to use to derive the funding account address.
     *
     * @defaultValue Defaults to not being used.
     */
    basePubkey?: PublicKey;
    /**
     * Seed to use to derive the funding account address.
     *
     * @defaultValue Defaults to not being used.
     */
    seed?: string;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type TransferSolOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const transferSolOperationHandler: OperationHandler<TransferSolOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type TransferSolBuilderParams = Omit<TransferSolInput, 'confirmOptions'> & {
    /** A key to distinguish the instruction that transfers some SOL. */
    instructionKey?: string;
};
/**
 * Transfers some SOL from one account to another.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .system()
 *   .builders()
 *   .transferSol({
 *     to: new PublicKey("..."),
 *     amount: sol(1.5),
 *   });
 * ````
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const transferSolBuilder: (metaplex: Metaplex, params: TransferSolBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
