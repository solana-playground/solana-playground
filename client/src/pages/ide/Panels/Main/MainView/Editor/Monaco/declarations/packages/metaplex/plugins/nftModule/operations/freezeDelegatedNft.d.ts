import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import type { Metaplex } from '../../../Metaplex';
import { Operation, OperationHandler, Signer } from '../../../types';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
declare const Key: "FreezeDelegatedNftOperation";
/**
 * Freezes a NFT via its delegate authority.
 *
 * ```ts
 * await metaplex
 *   .nfts()
 *   .freezeDelegatedNft({ mintAddress, delegateAuthority };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const freezeDelegatedNftOperation: import("../../../types").OperationConstructor<FreezeDelegatedNftOperation, "FreezeDelegatedNftOperation", FreezeDelegatedNftInput, FreezeDelegatedNftOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type FreezeDelegatedNftOperation = Operation<typeof Key, FreezeDelegatedNftInput, FreezeDelegatedNftOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FreezeDelegatedNftInput = {
    /** The address of the mint account. */
    mintAddress: PublicKey;
    /**
     * The SPL Token delegate authority.
     *
     * This authority should have been approved using
     * `metaplex.tokens().approveDelegateAuthority()` beforehand.
     */
    delegateAuthority: Signer;
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
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type FreezeDelegatedNftOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const freezeDelegatedNftOperationHandler: OperationHandler<FreezeDelegatedNftOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type FreezeDelegatedNftBuilderParams = Omit<FreezeDelegatedNftInput, 'confirmOptions'> & {
    /** A key to distinguish the instruction that freezes the NFT. */
    instructionKey?: string;
};
/**
 * Freezes a NFT via its delegate authority.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .freezeDelegatedNft({ mintAddress, delegateAuthority });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const freezeDelegatedNftBuilder: (metaplex: Metaplex, params: FreezeDelegatedNftBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
