import { LazyPurchase, Purchase } from '../models/Purchase';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "LoadPurchaseOperation";
/**
 * Transforms a `LazyPurchase` model into a `Purchase` model.
 *
 * ```ts
 * const purchase = await metaplex
 *   .auctionHouse()
 *   .loadPurchase({ lazyPurchase };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const loadPurchaseOperation: import("../../../types").OperationConstructor<LoadPurchaseOperation, "LoadPurchaseOperation", LoadPurchaseInput, Readonly<{
    model: "purchase";
    lazy: false;
    auctionHouse: import("..").AuctionHouse;
    asset: import("../../nftModule").SftWithToken | import("../../nftModule").NftWithToken;
    buyerAddress: import("@solana/web3.js").PublicKey;
    sellerAddress: import("@solana/web3.js").PublicKey;
    bookkeeperAddress: import("../../..").Option<import("@solana/web3.js").PublicKey>;
    receiptAddress: import("../../..").Option<import("@solana/web3.js").PublicKey>;
    price: import("../../../types").SolAmount | import("../../../types").SplTokenAmount;
    tokens: import("../../../types").SplTokenAmount;
    createdAt: import("../../../types").DateTime;
}>>;
/**
 * @group Operations
 * @category Types
 */
export declare type LoadPurchaseOperation = Operation<typeof Key, LoadPurchaseInput, Purchase>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type LoadPurchaseInput = {
    /** The `LazyPurchase` model to transform into the `Purchase`.  */
    lazyPurchase: LazyPurchase;
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
export declare const loadPurchaseOperationHandler: OperationHandler<LoadPurchaseOperation>;
export {};
