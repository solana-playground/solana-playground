import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import type { Metaplex } from '../../../Metaplex';
import { KeypairSigner, Operation, OperationHandler, Signer } from '../../../types';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
declare const Key: "FreezeTokensOperation";
/**
 * Freezes a token account.
 *
 * ```ts
 * await metaplex.tokens().freeze({ mintAddress, freezeAuthority });
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const freezeTokensOperation: import("../../../types").OperationConstructor<FreezeTokensOperation, "FreezeTokensOperation", FreezeTokensInput, FreezeTokensOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type FreezeTokensOperation = Operation<typeof Key, FreezeTokensInput, FreezeTokensOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FreezeTokensInput = {
    /** The address of the mint account. */
    mintAddress: PublicKey;
    /**
     * The freeze authority as a Signer.
     *
     * This may be provided as a PublicKey if and only if
     * the `multiSigners` parameter is provided.
     */
    freezeAuthority: PublicKey | Signer;
    /**
     * The owner of the token account.
     *
     * @defaultValue `metaplex.identity().publicKey`
     */
    tokenOwner?: PublicKey;
    /**
     * The address of the token account.
     *
     * @defaultValue Defaults to using the associated token account
     * from the `mintAddress` and `tokenOwner` parameters.
     */
    tokenAddress?: PublicKey;
    /**
     * The signing accounts to use if the freeze authority is a multisig.
     *
     * @defaultValue `[]`
     */
    multiSigners?: KeypairSigner[];
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type FreezeTokensOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const freezeTokensOperationHandler: OperationHandler<FreezeTokensOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type FreezeTokensBuilderParams = Omit<FreezeTokensInput, 'confirmOptions'> & {
    /** A key to distinguish the instruction that freezes the token account. */
    instructionKey?: string;
};
/**
 * Freezes a token account.
 *
 * ```ts
 * const transactionBuilder = metaplex.tokens().builders().freeze({ mintAddress, freezeAuthority });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const freezeTokensBuilder: (metaplex: Metaplex, params: FreezeTokensBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
