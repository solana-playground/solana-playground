import { LazyListing, Listing } from '../models/Listing';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "LoadListingOperation";
/**
 * Transforms a `LazyListing` model into a `Listing` model.
 *
 * ```ts
 * const listing = await metaplex
 *   .auctionHouse()
 *   .loadListing({ lazyListing };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const loadListingOperation: import("../../../types").OperationConstructor<LoadListingOperation, "LoadListingOperation", LoadListingInput, Readonly<{
    model: "listing";
    lazy: false;
    auctionHouse: import("..").AuctionHouse;
    asset: import("../../nftModule").SftWithToken | import("../../nftModule").NftWithToken;
    tradeStateAddress: import("../../../types").Pda;
    sellerAddress: import("@solana/web3.js").PublicKey;
    bookkeeperAddress: import("../../..").Option<import("@solana/web3.js").PublicKey>;
    receiptAddress: import("../../..").Option<import("../../../types").Pda>;
    purchaseReceiptAddress: import("../../..").Option<import("@solana/web3.js").PublicKey>;
    price: import("../../../types").SolAmount | import("../../../types").SplTokenAmount;
    tokens: import("../../../types").SplTokenAmount;
    createdAt: import("../../../types").DateTime;
    canceledAt: import("../../..").Option<import("../../../types").DateTime>;
}>>;
/**
 * @group Operations
 * @category Types
 */
export declare type LoadListingOperation = Operation<typeof Key, LoadListingInput, Listing>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type LoadListingInput = {
    /** The `LazyListing` model to transform into the `Listing`.  */
    lazyListing: LazyListing;
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
export declare const loadListingOperationHandler: OperationHandler<LoadListingOperation>;
export {};
