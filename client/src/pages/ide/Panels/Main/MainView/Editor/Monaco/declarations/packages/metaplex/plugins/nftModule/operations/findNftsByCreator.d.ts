import { PublicKey } from '@solana/web3.js';
import { Metadata, Nft, Sft } from '../models';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "FindNftsByCreatorOperation";
/**
 * Finds multiple NFTs and SFTs by their creator at a given position.
 *
 * ```ts
 * // Find all by first creator.
 * const nfts = await metaplex
 *   .nfts()
 *   .findAllByCreator({ creator };
 *
 * // Find all by second creator.
 * const nfts = await metaplex
 *   .nfts()
 *   .findAllByCreator({ creator, position: 2 };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const findNftsByCreatorOperation: import("../../../types").OperationConstructor<FindNftsByCreatorOperation, "FindNftsByCreatorOperation", FindNftsByCreatorInput, FindNftsByCreatorOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type FindNftsByCreatorOperation = Operation<typeof Key, FindNftsByCreatorInput, FindNftsByCreatorOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FindNftsByCreatorInput = {
    /** The address of the creator. */
    creator: PublicKey;
    /**
     * The position in which the provided creator should be located at.
     * E.g. `1` for searching the first creator, `2` for searching the
     * second creator, etc.
     *
     * @defaultValue `1`
     */
    position?: number;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type FindNftsByCreatorOutput = (Metadata | Nft | Sft)[];
/**
 * @group Operations
 * @category Handlers
 */
export declare const findNftsByCreatorOperationHandler: OperationHandler<FindNftsByCreatorOperation>;
export {};
