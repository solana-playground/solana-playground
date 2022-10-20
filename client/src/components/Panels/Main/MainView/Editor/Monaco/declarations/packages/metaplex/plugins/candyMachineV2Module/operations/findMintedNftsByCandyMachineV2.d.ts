import { PublicKey } from '@solana/web3.js';
import { Metadata, Nft } from '../../nftModule';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "FindMintedNftsByCandyMachineV2Operation";
/**
 * Find all minted NFTs from a given Candy Machine address.
 *
 * ```ts
 * const nfts = await metaplex
 *   .candyMachinesV2()
 *   .findMintedNfts({ candyMachine };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const findMintedNftsByCandyMachineV2Operation: import("../../../types").OperationConstructor<FindMintedNftsByCandyMachineV2Operation, "FindMintedNftsByCandyMachineV2Operation", FindMintedNftsByCandyMachineV2Input, FindMintedNftsByCandyMachineV2Output>;
/**
 * @group Operations
 * @category Types
 */
export declare type FindMintedNftsByCandyMachineV2Operation = Operation<typeof Key, FindMintedNftsByCandyMachineV2Input, FindMintedNftsByCandyMachineV2Output>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FindMintedNftsByCandyMachineV2Input = {
    /** The Candy Machine address. */
    candyMachine: PublicKey;
    /**
     * The Candy Machine version
     *
     * @defaultValue `2`
     */
    version?: 1 | 2;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type FindMintedNftsByCandyMachineV2Output = (Metadata | Nft)[];
/**
 * @group Operations
 * @category Handlers
 */
export declare const findMintedNftsByCandyMachineV2OperationHandler: OperationHandler<FindMintedNftsByCandyMachineV2Operation>;
export {};
