import type { PublicKey } from '@solana/web3.js';
import { Mint } from '../models/Mint';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "FindMintByAddressOperation";
/**
 * Finds a mint account by its address.
 *
 * ```ts
 * const mint = await metaplex.tokens().findMintByAddress({ address });
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const findMintByAddressOperation: import("../../../types").OperationConstructor<FindMintByAddressOperation, "FindMintByAddressOperation", FindMintByAddressInput, Mint>;
/**
 * @group Operations
 * @category Types
 */
export declare type FindMintByAddressOperation = Operation<typeof Key, FindMintByAddressInput, Mint>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FindMintByAddressInput = {
    /** The address of the mint account. */
    address: PublicKey;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const findMintByAddressOperationHandler: OperationHandler<FindMintByAddressOperation>;
export {};
