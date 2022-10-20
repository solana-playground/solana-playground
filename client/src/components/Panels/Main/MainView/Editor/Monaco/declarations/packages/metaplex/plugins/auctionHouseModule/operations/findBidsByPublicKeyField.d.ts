import { PublicKey } from '@solana/web3.js';
import { AuctionHouse, Bid, LazyBid } from '../models';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "FindBidsByPublicKeyOperation";
/**
 * Finds multiple Bids by specific criteria.
 *
 * ```ts
 * // Find bids by buyer.
 * const bids = await metaplex
 *   .auctionHouse()
 *   .findBidsBy({ auctionHouse, type: 'buyer', publicKey: buyer };
 *
 * // Find bids by metadata.
 * const bids = await metaplex
 *   .auctionHouse()
 *   .findBidsBy({ auctionHouse, type: 'metadata', publicKey: metadata };
 *
 * // Find bids by mint.
 * const bids = await metaplex
 *   .auctionHouse()
 *   .findBidsBy({ auctionHouse, type: 'mint', publicKey: mint };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const findBidsByPublicKeyFieldOperation: import("../../../types").OperationConstructor<FindBidsByPublicKeyFieldOperation, "FindBidsByPublicKeyOperation", FindBidsByPublicKeyFieldInput, FindBidsByPublicKeyFieldOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type FindBidsByPublicKeyFieldOperation = Operation<typeof Key, FindBidsByPublicKeyFieldInput, FindBidsByPublicKeyFieldOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FindBidsByPublicKeyFieldInput = {
    /** A type of criteria to use in search. */
    type: 'buyer' | 'metadata' | 'mint';
    /** A model of the Auction House related to these bids. */
    auctionHouse: AuctionHouse;
    /** The address to search for. */
    publicKey: PublicKey;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type FindBidsByPublicKeyFieldOutput = (LazyBid | Bid)[];
/**
 * @group Operations
 * @category Handlers
 */
export declare const findBidsByPublicKeyFieldOperationHandler: OperationHandler<FindBidsByPublicKeyFieldOperation>;
export {};
