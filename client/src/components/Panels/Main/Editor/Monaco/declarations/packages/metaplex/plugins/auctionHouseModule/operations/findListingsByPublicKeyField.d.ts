import { PublicKey } from '@solana/web3.js';
import { AuctionHouse, LazyListing, Listing } from '../models';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "FindListingsByPublicKeyOperation";
/**
 * Finds multiple Listings by specific criteria.
 *
 * ```ts
 * // Find listings by seller.
 * const listings = await metaplex
 *   .auctionHouse()
 *   .findListingsBy({ auctionHouse, type: 'seller', publicKey: seller };
 *
 * // Find listings by metadata.
 * const listings = await metaplex
 *   .auctionHouse()
 *   .findListingsBy({ auctionHouse, type: 'metadata', publicKey: metadata };
 *
 * // Find listings by mint.
 * const listings = await metaplex
 *   .auctionHouse()
 *   .findListingsBy({ auctionHouse, type: 'mint', publicKey: mint };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const findListingsByPublicKeyFieldOperation: import("../../../types").OperationConstructor<FindListingsByPublicKeyFieldOperation, "FindListingsByPublicKeyOperation", FindListingsByPublicKeyFieldInput, FindListingsByPublicKeyFieldOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type FindListingsByPublicKeyFieldOperation = Operation<typeof Key, FindListingsByPublicKeyFieldInput, FindListingsByPublicKeyFieldOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FindListingsByPublicKeyFieldInput = {
    /** A type of criteria to use in search. */
    type: 'seller' | 'metadata' | 'mint';
    /** A model of the Auction House related to these listings. */
    auctionHouse: AuctionHouse;
    /** The address to search for. */
    publicKey: PublicKey;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type FindListingsByPublicKeyFieldOutput = (Listing | LazyListing)[];
/**
 * @group Operations
 * @category Handlers
 */
export declare const findListingsByPublicKeyFieldOperationHandler: OperationHandler<FindListingsByPublicKeyFieldOperation>;
export {};
