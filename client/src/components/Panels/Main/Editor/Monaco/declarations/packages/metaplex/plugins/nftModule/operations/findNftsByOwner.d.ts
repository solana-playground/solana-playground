import { PublicKey } from '@solana/web3.js';
import { Metadata, Nft, Sft } from '../models';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "FindNftsByOwnerOperation";
/**
 * Finds multiple NFTs and SFTs by a given owner.
 *
 * ```ts
 * const nfts = await metaplex
 *   .nfts()
 *   .findAllByOwner({ owner };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const findNftsByOwnerOperation: import("../../../types").OperationConstructor<FindNftsByOwnerOperation, "FindNftsByOwnerOperation", FindNftsByOwnerInput, FindNftsByOwnerOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type FindNftsByOwnerOperation = Operation<typeof Key, FindNftsByOwnerInput, FindNftsByOwnerOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FindNftsByOwnerInput = {
    /** The address of the owner. */
    owner: PublicKey;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type FindNftsByOwnerOutput = (Metadata | Nft | Sft)[];
/**
 * @group Operations
 * @category Handlers
 */
export declare const findNftsByOwnerOperationHandler: OperationHandler<FindNftsByOwnerOperation>;
export {};
