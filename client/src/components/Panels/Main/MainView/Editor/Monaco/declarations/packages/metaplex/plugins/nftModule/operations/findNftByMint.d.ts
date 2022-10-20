import { PublicKey } from '@solana/web3.js';
import { Nft, NftWithToken, Sft, SftWithToken } from '../models';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "FindNftByMintOperation";
/**
 * Finds an NFT or an SFT by its mint address.
 *
 * ```ts
 * const nft = await metaplex
 *   .nfts()
 *   .findByMint({ mintAddress };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const findNftByMintOperation: import("../../../types").OperationConstructor<FindNftByMintOperation, "FindNftByMintOperation", FindNftByMintInput, Sft | SftWithToken | Nft | NftWithToken>;
/**
 * @group Operations
 * @category Types
 */
export declare type FindNftByMintOperation = Operation<typeof Key, FindNftByMintInput, FindNftByMintOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FindNftByMintInput = {
    /** The address of the mint account. */
    mintAddress: PublicKey;
    /**
     * The explicit token account to fetch with the NFT or SFT.
     *
     * If provided, and if that address is valid, the NFT or SFT returned
     * will be of the type `NftWithToken` or `SftWithToken` respectively.
     *
     * Alternatively, you may use the `tokenOwner` parameter to fetch the
     * associated token account.
     *
     * @defaultValue Defaults to not fetching the token account.
     */
    tokenAddress?: PublicKey;
    /**
     * The associated token account to fetch with the NFT or SFT.
     *
     * If provided, and if that account exists, the NFT or SFT returned
     * will be of the type `NftWithToken` or `SftWithToken` respectively.
     *
     * Alternatively, you may use the `tokenAddress` parameter to fetch the
     * token account at an explicit address.
     *
     * @defaultValue Defaults to not fetching the associated token account.
     */
    tokenOwner?: PublicKey;
    /**
     * Whether or not we should fetch the JSON Metadata for the NFT or SFT.
     *
     * @defaultValue `true`
     */
    loadJsonMetadata?: boolean;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type FindNftByMintOutput = Nft | Sft | NftWithToken | SftWithToken;
/**
 * @group Operations
 * @category Handlers
 */
export declare const findNftByMintOperationHandler: OperationHandler<FindNftByMintOperation>;
export {};
