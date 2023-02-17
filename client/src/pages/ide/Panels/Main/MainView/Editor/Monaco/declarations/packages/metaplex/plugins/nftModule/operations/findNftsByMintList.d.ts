import { PublicKey } from '@solana/web3.js';
import { Metadata, Nft, Sft } from '../models';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "FindNftsByMintListOperation";
/**
 * Finds multiple NFTs and SFTs by a given list of mint addresses.
 *
 * ```ts
 * const nfts = await metaplex
 *   .nfts()
 *   .findAllByMintList({ mints: [...] };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const findNftsByMintListOperation: import("../../../types").OperationConstructor<FindNftsByMintListOperation, "FindNftsByMintListOperation", FindNftsByMintListInput, FindNftsByMintListOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type FindNftsByMintListOperation = Operation<typeof Key, FindNftsByMintListInput, FindNftsByMintListOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FindNftsByMintListInput = {
    /** The addresses of all mint accounts we want to fetch. */
    mints: PublicKey[];
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type FindNftsByMintListOutput = (Metadata | Nft | Sft | null)[];
/**
 * @group Operations
 * @category Handlers
 */
export declare const findNftsByMintListOperationHandler: OperationHandler<FindNftsByMintListOperation>;
export {};
