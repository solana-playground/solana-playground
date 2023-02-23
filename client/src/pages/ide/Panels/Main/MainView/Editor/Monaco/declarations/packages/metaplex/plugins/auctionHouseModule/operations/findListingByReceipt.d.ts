import type { PublicKey } from '@solana/web3.js';
import { AuctionHouse, Listing } from '../models';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "FindListingByReceiptOperation";
/**
 * Finds a Listing by its receipt address.
 *
 * ```ts
 * const nft = await metaplex
 *   .auctionHouse()
 *   .findListingByReceipt({ receiptAddress, auctionHouse };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const findListingByReceiptOperation: import("../../../types").OperationConstructor<FindListingByReceiptOperation, "FindListingByReceiptOperation", FindListingByReceiptInput, Readonly<{
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
export declare type FindListingByReceiptOperation = Operation<typeof Key, FindListingByReceiptInput, Listing>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FindListingByReceiptInput = {
    /**
     * The address of the listing receipt account.
     * This is the account that stores information about this listing.
     * The Listing model is built on top of this account.
     */
    receiptAddress: PublicKey;
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
export declare const findListingByReceiptOperationHandler: OperationHandler<FindListingByReceiptOperation>;
export {};
