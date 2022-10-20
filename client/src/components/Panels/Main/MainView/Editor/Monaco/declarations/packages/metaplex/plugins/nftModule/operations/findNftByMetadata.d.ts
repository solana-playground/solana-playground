import { PublicKey } from '@solana/web3.js';
import { Nft, NftWithToken, Sft, SftWithToken } from '../models';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "FindNftByMetadataOperation";
/**
 * Finds an NFT or an SFT by its metadata address.
 *
 * ```ts
 * const nft = await metaplex
 *   .nfts()
 *   .findByMetadata({ metadata };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const findNftByMetadataOperation: import("../../../types").OperationConstructor<FindNftByMetadataOperation, "FindNftByMetadataOperation", FindNftByMetadataInput, Sft | SftWithToken | Nft | NftWithToken>;
/**
 * @group Operations
 * @category Types
 */
export declare type FindNftByMetadataOperation = Operation<typeof Key, FindNftByMetadataInput, FindNftByMetadataOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FindNftByMetadataInput = {
    /** The address of the metadata account. */
    metadata: PublicKey;
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
export declare type FindNftByMetadataOutput = Nft | Sft | NftWithToken | SftWithToken;
/**
 * @group Operations
 * @category Handlers
 */
export declare const findNftByMetadataOperationHandler: OperationHandler<FindNftByMetadataOperation>;
export {};
