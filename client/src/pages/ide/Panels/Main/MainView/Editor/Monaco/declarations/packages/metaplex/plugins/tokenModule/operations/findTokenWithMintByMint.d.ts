import type { PublicKey } from '@solana/web3.js';
import { TokenWithMint } from '../models/Token';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "FindTokenWithMintByMintOperation";
/**
 * Finds a token account and its associated mint account
 * by providing the mint address and either:
 * - the token address or
 * - the address of the token's owner.
 *
 * ```ts
 * const tokenWithMint = await metaplex
 *   .tokens()
 *   .findTokenWithMintByMint({ mint, address: tokenAddress, type: "token" };
 *
 * const tokenWithMint = await metaplex
 *   .tokens()
 *   .findTokenWithMintByMint({ mint, address: ownerAddress, type: "owner" };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const findTokenWithMintByMintOperation: import("../../../types").OperationConstructor<FindTokenWithMintByMintOperation, "FindTokenWithMintByMintOperation", FindTokenWithMintByMintInput, TokenWithMint>;
/**
 * @group Operations
 * @category Types
 */
export declare type FindTokenWithMintByMintOperation = Operation<typeof Key, FindTokenWithMintByMintInput, TokenWithMint>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FindTokenWithMintByMintInput = {
    /** The address of the mint account. */
    mint: PublicKey;
    /**
     * The address of the token account or its owner,
     * distinguished by the `addressType`` parameter.
     */
    address: PublicKey;
    /**
     * Determines whether the `address` parameter is the token address
     * or the address of its owner.
     */
    addressType: 'owner' | 'token';
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const findTokenWithMintByMintOperationHandler: OperationHandler<FindTokenWithMintByMintOperation>;
export {};
