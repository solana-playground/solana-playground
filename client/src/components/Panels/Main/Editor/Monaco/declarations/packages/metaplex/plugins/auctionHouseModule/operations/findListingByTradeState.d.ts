import type { PublicKey } from '@solana/web3.js';
import { AuctionHouse, Listing } from '../models';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "FindListingByTradeStateOperation";
/**
 * Finds a Listing by its trade state address.
 *
 * ```ts
 * const nft = await metaplex
 *   .auctionHouse()
 *   .findListingByTradeState({ tradeStateAddress, auctionHouse };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const findListingByTradeStateOperation: import("../../../types").OperationConstructor<FindListingByTradeStateOperation, "FindListingByTradeStateOperation", FindListingByTradeStateInput, Readonly<{
    model: "listing";
    lazy: false;
    auctionHouse: AuctionHouse;
    asset: import("../..").SftWithToken | import("../..").NftWithToken;
    tradeStateAddress: import("../../../types").Pda;
    sellerAddress: PublicKey;
    bookkeeperAddress: import("../../..").Option<PublicKey>;
    receiptAddress: import("../../..").Option<import("../../../types").Pda>;
    purchaseReceiptAddress: import("../../..").Option<PublicKey>;
    price: import("../../../types").SolAmount | import("../../../types").SplTokenAmount;
    tokens: import("../../../types").SplTokenAmount;
    createdAt: import("../../../types").DateTime;
    canceledAt: import("../../..").Option<import("../../../types").DateTime>;
}>>;
/**
 * @group Operations
 * @category Types
 */
export declare type FindListingByTradeStateOperation = Operation<typeof Key, FindListingByTradeStateInput, Listing>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FindListingByTradeStateInput = {
    /** Seller trade state PDA account encoding the listing order. */
    tradeStateAddress: PublicKey;
    /** A model of the Auction House related to this listing. */
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
export declare const findListingByTradeStateOperationHandler: OperationHandler<FindListingByTradeStateOperation>;
export {};
