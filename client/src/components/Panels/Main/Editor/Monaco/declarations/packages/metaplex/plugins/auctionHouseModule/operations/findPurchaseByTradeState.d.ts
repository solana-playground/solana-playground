import type { PublicKey } from '@solana/web3.js';
import { AuctionHouse, Purchase } from '../models';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "FindPurchaseByTradeStateOperation";
/**
 * Finds a Purchase by its trade state address.
 *
 * ```ts
 * const nft = await metaplex
 *   .auctionHouse()
 *   .findPurchaseByTradeState({ sellerTradeState, buyerTradeState, auctionHouse };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const findPurchaseByTradeStateOperation: import("../../../types").OperationConstructor<FindPurchaseByTradeStateOperation, "FindPurchaseByTradeStateOperation", FindPurchaseByTradeStateInput, Readonly<{
    model: "purchase";
    lazy: false;
    auctionHouse: AuctionHouse;
    asset: import("../..").SftWithToken | import("../..").NftWithToken;
    buyerAddress: PublicKey;
    sellerAddress: PublicKey;
    bookkeeperAddress: import("../../..").Option<PublicKey>;
    receiptAddress: import("../../..").Option<PublicKey>;
    price: import("../../../types").SolAmount | import("../../../types").SplTokenAmount;
    tokens: import("../../../types").SplTokenAmount;
    createdAt: import("../../../types").DateTime;
}>>;
/**
 * @group Operations
 * @category Types
 */
export declare type FindPurchaseByTradeStateOperation = Operation<typeof Key, FindPurchaseByTradeStateInput, Purchase>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FindPurchaseByTradeStateInput = {
    /** Seller trade state PDA account encoding the listing order. */
    sellerTradeState: PublicKey;
    /** Buyer trade state PDA account encoding the bid order. */
    buyerTradeState: PublicKey;
    /** A model of the Auction House related to this purchase. */
    auctionHouse: AuctionHouse;
    /**
     * Whether or not we should fetch the JSON Metadata for the NFT or SFT.
     *
     * @defaultValue `true`
     */
    loadJsonMetadata?: boolean;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const findPurchaseByTradeStateOperationHandler: OperationHandler<FindPurchaseByTradeStateOperation>;
export {};
