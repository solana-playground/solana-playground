import { Bid, LazyBid } from '../models/Bid';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "LoadBidOperation";
/**
 * Transforms a `LazyBid` model into a `Bid` model.
 *
 * ```ts
 * const bid = await metaplex
 *   .auctionHouse()
 *   .loadBid({ lazyBid };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const loadBidOperation: import("../../../types").OperationConstructor<LoadBidOperation, "LoadBidOperation", LoadBidInput, Readonly<{
    model: "bid";
    lazy: false;
    auctionHouse: import("..").AuctionHouse;
    tradeStateAddress: import("../../../types").Pda;
    buyerAddress: import("@solana/web3.js").PublicKey;
    bookkeeperAddress: import("../../../utils").Option<import("@solana/web3.js").PublicKey>;
    receiptAddress: import("../../../utils").Option<import("../../../types").Pda>;
    purchaseReceiptAddress: import("../../../utils").Option<import("@solana/web3.js").PublicKey>;
    price: import("../../../types").SolAmount | import("../../../types").SplTokenAmount;
    tokens: import("../../../types").SplTokenAmount;
    createdAt: import("../../../types").DateTime;
    canceledAt: import("../../../utils").Option<import("../../../types").DateTime>;
} & {
    isPublic: false;
    asset: import("../../nftModule").SftWithToken | import("../../nftModule").NftWithToken;
}> | Readonly<{
    model: "bid";
    lazy: false;
    auctionHouse: import("..").AuctionHouse;
    tradeStateAddress: import("../../../types").Pda;
    buyerAddress: import("@solana/web3.js").PublicKey;
    bookkeeperAddress: import("../../../utils").Option<import("@solana/web3.js").PublicKey>;
    receiptAddress: import("../../../utils").Option<import("../../../types").Pda>;
    purchaseReceiptAddress: import("../../../utils").Option<import("@solana/web3.js").PublicKey>;
    price: import("../../../types").SolAmount | import("../../../types").SplTokenAmount;
    tokens: import("../../../types").SplTokenAmount;
    createdAt: import("../../../types").DateTime;
    canceledAt: import("../../../utils").Option<import("../../../types").DateTime>;
} & {
    isPublic: true;
    asset: import("../../nftModule").Sft | import("../../nftModule").Nft;
}>>;
/**
 * @group Operations
 * @category Types
 */
export declare type LoadBidOperation = Operation<typeof Key, LoadBidInput, Bid>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type LoadBidInput = {
    /** The `LazyBid` model to transform into the `Bid`.  */
    lazyBid: LazyBid;
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
export declare const loadBidOperationHandler: OperationHandler<LoadBidOperation>;
export {};
