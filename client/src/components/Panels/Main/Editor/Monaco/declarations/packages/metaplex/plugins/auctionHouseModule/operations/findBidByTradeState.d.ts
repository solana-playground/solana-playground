import type { PublicKey } from '@solana/web3.js';
import { AuctionHouse, Bid } from '../models';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "FindBidByTradeStateOperation";
/**
 * Finds a Bid by its trade state address.
 *
 * ```ts
 * const nft = await metaplex
 *   .auctionHouse()
 *   .findBidByTradeState({ tradeStateAddress, auctionHouse };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const findBidByTradeStateOperation: import("../../../types").OperationConstructor<FindBidByTradeStateOperation, "FindBidByTradeStateOperation", FindBidByTradeStateInput, Readonly<{
    model: "bid";
    lazy: false;
    auctionHouse: AuctionHouse;
    tradeStateAddress: import("../../../types").Pda;
    buyerAddress: PublicKey;
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
    buyerAddress: PublicKey;
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
export declare type FindBidByTradeStateOperation = Operation<typeof Key, FindBidByTradeStateInput, Bid>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FindBidByTradeStateInput = {
    /** Buyer trade state PDA account encoding the bid order. */
    tradeStateAddress: PublicKey;
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
export declare const findBidByTradeStateOperationHandler: OperationHandler<FindBidByTradeStateOperation>;
export {};
