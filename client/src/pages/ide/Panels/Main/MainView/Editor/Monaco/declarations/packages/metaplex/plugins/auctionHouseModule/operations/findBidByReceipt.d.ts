import type { PublicKey } from '@solana/web3.js';
import { AuctionHouse, Bid } from '../models';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "FindBidByReceiptOperation";
/**
 * Finds a Bid by its receipt address.
 *
 * ```ts
 * const nft = await metaplex
 *   .auctionHouse()
 *   .findBidByReceipt({ receiptAddress, auctionHouse };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const findBidByReceiptOperation: import("../../../types").OperationConstructor<FindBidByReceiptOperation, "FindBidByReceiptOperation", FindBidByReceiptInput, Readonly<{
    model: "bid";
    lazy: false;
    auctionHouse: AuctionHouse;
    tradeStateAddress: import("../../../types").Pda;
    buyerAddress: PublicKey; /**
     * The address of the bid receipt account.
     * This is the account that stores information about this bid.
     * The Bid model is built on top of this account.
     */
    bookkeeperAddress: import("../../..").Option<PublicKey>;
    receiptAddress: import("../../..").Option<import("../../../types").Pda>;
    purchaseReceiptAddress: import("../../..").Option<PublicKey>;
    price: import("../../../types").SolAmount | import("../../../types").SplTokenAmount;
    tokens: import("../../../types").SplTokenAmount;
    createdAt: import("../../../types").DateTime;
    canceledAt: import("../../..").Option<import("../../../types").DateTime>;
} & {
    isPublic: false;
    asset: import("../..").SftWithToken | import("../..").NftWithToken;
}> | Readonly<{
    model: "bid";
    lazy: false;
    auctionHouse: AuctionHouse;
    tradeStateAddress: import("../../../types").Pda;
    buyerAddress: PublicKey; /**
     * The address of the bid receipt account.
     * This is the account that stores information about this bid.
     * The Bid model is built on top of this account.
     */
    bookkeeperAddress: import("../../..").Option<PublicKey>;
    receiptAddress: import("../../..").Option<import("../../../types").Pda>;
    purchaseReceiptAddress: import("../../..").Option<PublicKey>;
    price: import("../../../types").SolAmount | import("../../../types").SplTokenAmount;
    tokens: import("../../../types").SplTokenAmount;
    createdAt: import("../../../types").DateTime;
    canceledAt: import("../../..").Option<import("../../../types").DateTime>;
} & {
    isPublic: true;
    asset: import("../..").Sft | import("../..").Nft;
}>>;
/**
 * @group Operations
 * @category Types
 */
export declare type FindBidByReceiptOperation = Operation<typeof Key, FindBidByReceiptInput, Bid>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FindBidByReceiptInput = {
    /**
     * The address of the bid receipt account.
     * This is the account that stores information about this bid.
     * The Bid model is built on top of this account.
     */
    receiptAddress: PublicKey;
    /** A model of the Auction House related to this bid. */
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
export declare const findBidByReceiptOperationHandler: OperationHandler<FindBidByReceiptOperation>;
export {};
