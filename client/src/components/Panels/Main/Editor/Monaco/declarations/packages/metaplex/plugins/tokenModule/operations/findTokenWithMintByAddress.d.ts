import type { PublicKey } from '@solana/web3.js';
import { TokenWithMint } from '../models/Token';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "FindTokenWithMintByAddressOperation";
/**
 * Finds a token account and its associated mint account
 * by providing the token address.
 *
 * ```ts
 * const tokenWithMint = await metaplex.tokens().findTokenWithMintByAddress({ address });
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const findTokenWithMintByAddressOperation: import("../../../types").OperationConstructor<FindTokenWithMintByAddressOperation, "FindTokenWithMintByAddressOperation", FindTokenWithMintByAddressInput, TokenWithMint>;
/**
 * @group Operations
 * @category Types
 */
export declare type FindTokenWithMintByAddressOperation = Operation<typeof Key, FindTokenWithMintByAddressInput, TokenWithMint>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FindTokenWithMintByAddressInput = {
    /** The address of the token account. */
    address: PublicKey;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const findTokenWithMintByAddressOperationHandler: OperationHandler<FindTokenWithMintByAddressOperation>;
export {};
