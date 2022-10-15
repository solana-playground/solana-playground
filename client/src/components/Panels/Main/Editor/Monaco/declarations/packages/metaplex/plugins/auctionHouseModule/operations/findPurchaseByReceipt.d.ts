import type { PublicKey } from '@solana/web3.js';
import { AuctionHouse, Purchase } from '../models';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "FindPurchaseByReceiptOperation";
/**
 * Finds a Purchase by its receipt address.
 *
 * ```ts
 * const nft = await metaplex
 *   .auctionHouse()
 *   .findPurchaseByReceipt({ receiptAddress, auctionHouse };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const findPurchaseByReceiptOperation: import("../../../types").OperationConstructor<FindPurchaseByReceiptOperation, "FindPurchaseByReceiptOperation", FindPurchaseByReceiptInput, Readonly<{
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
export declare type FindPurchaseByReceiptOperation = Operation<typeof Key, FindPurchaseByReceiptInput, Purchase>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FindPurchaseByReceiptInput = {
    /**
     * The address of the purchase receipt account.
     * This is the account that stores information about this purchase.
     * The Purchase model is built on top of this account.
     */
    receiptAddress: PublicKey;
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
export declare const findPurchaseByReceiptOperationHandler: OperationHandler<FindPurchaseByReceiptOperation>;
export {};
