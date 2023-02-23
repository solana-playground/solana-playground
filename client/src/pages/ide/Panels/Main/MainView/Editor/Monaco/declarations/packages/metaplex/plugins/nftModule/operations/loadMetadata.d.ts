import { PublicKey } from '@solana/web3.js';
import { Metadata, Nft, NftWithToken, Sft, SftWithToken } from '../models';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "LoadMetadataOperation";
/**
 * Transforms a `Metadata` model into a `Nft` or `Sft` model.
 *
 * ```ts
 * const nfts = await metaplex
 *   .nfts()
 *   .load({ metadata };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const loadMetadataOperation: import("../../../types").OperationConstructor<LoadMetadataOperation, "LoadMetadataOperation", LoadMetadataInput, Sft | SftWithToken | Nft | NftWithToken>;
/**
 * @group Operations
 * @category Types
 */
export declare type LoadMetadataOperation = Operation<typeof Key, LoadMetadataInput, LoadMetadataOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type LoadMetadataInput = {
    /** The address of the metadata account. */
    metadata: Metadata;
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
export declare type LoadMetadataOutput = Nft | Sft | NftWithToken | SftWithToken;
/**
 * @group Operations
 * @category Handlers
 */
export declare const loadMetadataOperationHandler: OperationHandler<LoadMetadataOperation>;
export {};
