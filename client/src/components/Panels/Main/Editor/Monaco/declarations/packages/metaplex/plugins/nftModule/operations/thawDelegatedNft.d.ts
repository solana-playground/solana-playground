import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import type { Metaplex } from '../../../Metaplex';
import { Operation, OperationHandler, Signer } from '../../../types';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
declare const Key: "ThawDelegatedNftOperation";
/**
 * Thaws a NFT via its delegate authority.
 *
 * ```ts
 * await metaplex
 *   .nfts()
 *   .thawDelegatedNft({ mintAddress, delegateAuthority };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const thawDelegatedNftOperation: import("../../../types").OperationConstructor<ThawDelegatedNftOperation, "ThawDelegatedNftOperation", ThawDelegatedNftInput, ThawDelegatedNftOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type ThawDelegatedNftOperation = Operation<typeof Key, ThawDelegatedNftInput, ThawDelegatedNftOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type ThawDelegatedNftInput = {
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
export declare type ThawDelegatedNftOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const thawDelegatedNftOperationHandler: OperationHandler<ThawDelegatedNftOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type ThawDelegatedNftBuilderParams = Omit<ThawDelegatedNftInput, 'confirmOptions'> & {
    /** A key to distinguish the instruction that thaws the NFT. */
    instructionKey?: string;
};
/**
 * Thaws a NFT via its delegate authority.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .thawDelegatedNft({ mintAddress, delegateAuthority });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const thawDelegatedNftBuilder: (metaplex: Metaplex, params: ThawDelegatedNftBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
