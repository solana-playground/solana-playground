import { AuctionHouseBuildersClient } from './AuctionHouseBuildersClient';
import { CancelBidInput, CancelListingInput, CreateAuctionHouseInput, CreateBidInput, CreateListingInput, DepositToBuyerAccountInput, DirectBuyInput, DirectSellInput, ExecuteSaleInput, FindAuctionHouseByAddressInput, FindAuctionHouseByCreatorAndMintInput, FindBidByReceiptInput, FindBidByTradeStateInput, FindBidsByPublicKeyFieldInput, FindListingByReceiptInput, FindListingByTradeStateInput, FindListingsByPublicKeyFieldInput, FindPurchaseByReceiptInput, FindPurchaseByTradeStateInput, FindPurchasesByPublicKeyFieldInput, GetBuyerBalanceInput, LoadBidInput, LoadListingInput, LoadPurchaseInput, UpdateAuctionHouseInput, WithdrawFromBuyerAccountInput, WithdrawFromFeeAccountInput, WithdrawFromTreasuryAccountInput } from './operations';
import { AuctionHousePdasClient } from './AuctionHousePdasClient';
import type { Metaplex } from '../../Metaplex';
import { OperationOptions } from '../../types';
/**
 * This is a client for the Auction House module.
 *
 * It enables us to interact with the Auction House program in order to
 * create and update Auction House to configure a marketplace as well to allow
 * users to list, bid and execute sales.
 *
 * You may access this client via the `auctionHouse()` method of your `Metaplex` instance.
 *
 * ```ts
 * const auctionHouseClient = metaplex.auctionHouse();
 * ```
 *
 * @example
 * You can create a new Auction House with minimum input like so.
 * By default, the current identity of the Metaplex instance will be
 * the authority of the Auction House.
 *
 * ```ts
 * const { auctionHouse } = await metaplex
 *   .auctionHouse()
 *   .create({
 *     sellerFeeBasisPoints: 500, // 5% royalties
 *   };
 * ```
 *
 * @see {@link AuctionHouse} The `AuctionHouse` model
 * @group Modules
 */
export declare class AuctionHouseClient {
    protected readonly metaplex: Metaplex;
    constructor(metaplex: Metaplex);
    /**
     * You may use the `builders()` client to access the
     * underlying Transaction Builders of this module.
     *
     * ```ts
     * const buildersClient = metaplex.auctions().builders();
     * ```
     */
    builders(): AuctionHouseBuildersClient;
    /**
     * You may use the `pdas()` client to build PDAs related to this module.
     *
     * ```ts
     * const pdasClient = metaplex.auctionHouse().pdas();
     * ```
     */
    pdas(): AuctionHousePdasClient;
    /** {@inheritDoc createBidOperation} */
    bid(input: CreateBidInput, options?: OperationOptions): Promise<import("./operations").CreateBidOutput>;
    /** {@inheritDoc buyOperation} */
    buy(input: DirectBuyInput, options?: OperationOptions): Promise<import("./operations").DirectBuyOutput>;
    /** {@inheritDoc cancelBidOperation} */
    cancelBid(input: CancelBidInput, options?: OperationOptions): Promise<import("./operations").CancelBidOutput>;
    /** {@inheritDoc cancelListingOperation} */
    cancelListing(input: CancelListingInput, options?: OperationOptions): Promise<import("./operations").CancelListingOutput>;
    /** {@inheritDoc createAuctionHouseOperation} */
    create(input: CreateAuctionHouseInput, options?: OperationOptions): Promise<import("./operations").CreateAuctionHouseOutput>;
    /** {@inheritDoc depositToBuyerAccountOperation} */
    depositToBuyerAccount(input: DepositToBuyerAccountInput, options?: OperationOptions): Promise<import("./operations").DepositToBuyerAccountOutput>;
    /** {@inheritDoc executeSaleOperation} */
    executeSale(input: ExecuteSaleInput, options?: OperationOptions): Promise<import("./operations").ExecuteSaleOutput>;
    /** {@inheritDoc findAuctionHouseByAddressOperation} */
    findByAddress(input: FindAuctionHouseByAddressInput, options?: OperationOptions): Promise<Readonly<{
        model: "auctionHouse";
        address: import("../../types").Pda;
        creatorAddress: import("@solana/web3.js").PublicKey;
        authorityAddress: import("@solana/web3.js").PublicKey;
        treasuryMint: import("..").Mint;
        feeAccountAddress: import("../../types").Pda;
        treasuryAccountAddress: import("../../types").Pda;
        feeWithdrawalDestinationAddress: import("@solana/web3.js").PublicKey;
        treasuryWithdrawalDestinationAddress: import("@solana/web3.js").PublicKey;
        sellerFeeBasisPoints: number;
        requiresSignOff: boolean;
        canChangeSalePrice: boolean;
        isNative: boolean;
    } & {
        hasAuctioneer: false;
    }> | Readonly<{
        model: "auctionHouse";
        address: import("../../types").Pda;
        creatorAddress: import("@solana/web3.js").PublicKey;
        authorityAddress: import("@solana/web3.js").PublicKey;
        treasuryMint: import("..").Mint;
        feeAccountAddress: import("../../types").Pda;
        treasuryAccountAddress: import("../../types").Pda;
        feeWithdrawalDestinationAddress: import("@solana/web3.js").PublicKey;
        treasuryWithdrawalDestinationAddress: import("@solana/web3.js").PublicKey;
        sellerFeeBasisPoints: number;
        requiresSignOff: boolean;
        canChangeSalePrice: boolean;
        isNative: boolean;
    } & {
        hasAuctioneer: true;
        auctioneer: {
            address: import("@solana/web3.js").PublicKey;
            authority: import("@solana/web3.js").PublicKey;
            scopes: import("@metaplex-foundation/mpl-auction-house").AuthorityScope[];
        };
    }>>;
    /** {@inheritDoc findAuctionHouseByCreatorAndMintOperation} */
    findByCreatorAndMint(input: FindAuctionHouseByCreatorAndMintInput, options?: OperationOptions): Promise<Readonly<{
        model: "auctionHouse";
        address: import("../../types").Pda;
        creatorAddress: import("@solana/web3.js").PublicKey;
        authorityAddress: import("@solana/web3.js").PublicKey;
        treasuryMint: import("..").Mint;
        feeAccountAddress: import("../../types").Pda;
        treasuryAccountAddress: import("../../types").Pda;
        feeWithdrawalDestinationAddress: import("@solana/web3.js").PublicKey;
        treasuryWithdrawalDestinationAddress: import("@solana/web3.js").PublicKey;
        sellerFeeBasisPoints: number;
        requiresSignOff: boolean;
        canChangeSalePrice: boolean;
        isNative: boolean;
    } & {
        hasAuctioneer: false;
    }> | Readonly<{
        model: "auctionHouse";
        address: import("../../types").Pda;
        creatorAddress: import("@solana/web3.js").PublicKey;
        authorityAddress: import("@solana/web3.js").PublicKey;
        treasuryMint: import("..").Mint;
        feeAccountAddress: import("../../types").Pda;
        treasuryAccountAddress: import("../../types").Pda;
        feeWithdrawalDestinationAddress: import("@solana/web3.js").PublicKey;
        treasuryWithdrawalDestinationAddress: import("@solana/web3.js").PublicKey;
        sellerFeeBasisPoints: number;
        requiresSignOff: boolean;
        canChangeSalePrice: boolean;
        isNative: boolean;
    } & {
        hasAuctioneer: true;
        auctioneer: {
            address: import("@solana/web3.js").PublicKey;
            authority: import("@solana/web3.js").PublicKey;
            scopes: import("@metaplex-foundation/mpl-auction-house").AuthorityScope[];
        };
    }>>;
    /** {@inheritDoc findBidByReceiptOperation} */
    findBidByReceipt(input: FindBidByReceiptInput, options?: OperationOptions): Promise<Readonly<{
        model: "bid";
        lazy: false;
        auctionHouse: import("./models").AuctionHouse;
        tradeStateAddress: import("../../types").Pda;
        buyerAddress: import("@solana/web3.js").PublicKey;
        bookkeeperAddress: import("../..").Option<import("@solana/web3.js").PublicKey>;
        receiptAddress: import("../..").Option<import("../../types").Pda>;
        purchaseReceiptAddress: import("../..").Option<import("@solana/web3.js").PublicKey>;
        price: import("../../types").SolAmount | import("../../types").SplTokenAmount;
        tokens: import("../../types").SplTokenAmount;
        /**
         * This is a client for the Auction House module.
         *
         * It enables us to interact with the Auction House program in order to
         * create and update Auction House to configure a marketplace as well to allow
         * users to list, bid and execute sales.
         *
         * You may access this client via the `auctionHouse()` method of your `Metaplex` instance.
         *
         * ```ts
         * const auctionHouseClient = metaplex.auctionHouse();
         * ```
         *
         * @example
         * You can create a new Auction House with minimum input like so.
         * By default, the current identity of the Metaplex instance will be
         * the authority of the Auction House.
         *
         * ```ts
         * const { auctionHouse } = await metaplex
         *   .auctionHouse()
         *   .create({
         *     sellerFeeBasisPoints: 500, // 5% royalties
         *   };
         * ```
         *
         * @see {@link AuctionHouse} The `AuctionHouse` model
         * @group Modules
         */
        createdAt: import("../../types").DateTime;
        canceledAt: import("../..").Option<import("../../types").DateTime>;
    } & {
        isPublic: false;
        asset: import("..").SftWithToken | import("..").NftWithToken;
    }> | Readonly<{
        model: "bid";
        lazy: false;
        auctionHouse: import("./models").AuctionHouse;
        tradeStateAddress: import("../../types").Pda;
        buyerAddress: import("@solana/web3.js").PublicKey;
        bookkeeperAddress: import("../..").Option<import("@solana/web3.js").PublicKey>;
        receiptAddress: import("../..").Option<import("../../types").Pda>;
        purchaseReceiptAddress: import("../..").Option<import("@solana/web3.js").PublicKey>;
        price: import("../../types").SolAmount | import("../../types").SplTokenAmount;
        tokens: import("../../types").SplTokenAmount;
        /**
         * This is a client for the Auction House module.
         *
         * It enables us to interact with the Auction House program in order to
         * create and update Auction House to configure a marketplace as well to allow
         * users to list, bid and execute sales.
         *
         * You may access this client via the `auctionHouse()` method of your `Metaplex` instance.
         *
         * ```ts
         * const auctionHouseClient = metaplex.auctionHouse();
         * ```
         *
         * @example
         * You can create a new Auction House with minimum input like so.
         * By default, the current identity of the Metaplex instance will be
         * the authority of the Auction House.
         *
         * ```ts
         * const { auctionHouse } = await metaplex
         *   .auctionHouse()
         *   .create({
         *     sellerFeeBasisPoints: 500, // 5% royalties
         *   };
         * ```
         *
         * @see {@link AuctionHouse} The `AuctionHouse` model
         * @group Modules
         */
        createdAt: import("../../types").DateTime;
        canceledAt: import("../..").Option<import("../../types").DateTime>;
    } & {
        isPublic: true;
        asset: import("..").Sft | import("..").Nft;
    }>>;
    /** {@inheritDoc findBidByTradeStateOperation} */
    findBidByTradeState(input: FindBidByTradeStateInput, options?: OperationOptions): Promise<Readonly<{
        model: "bid";
        lazy: false;
        auctionHouse: import("./models").AuctionHouse;
        tradeStateAddress: import("../../types").Pda;
        buyerAddress: import("@solana/web3.js").PublicKey;
        bookkeeperAddress: import("../..").Option<import("@solana/web3.js").PublicKey>;
        receiptAddress: import("../..").Option<import("../../types").Pda>;
        purchaseReceiptAddress: import("../..").Option<import("@solana/web3.js").PublicKey>;
        price: import("../../types").SolAmount | import("../../types").SplTokenAmount;
        tokens: import("../../types").SplTokenAmount;
        /**
         * This is a client for the Auction House module.
         *
         * It enables us to interact with the Auction House program in order to
         * create and update Auction House to configure a marketplace as well to allow
         * users to list, bid and execute sales.
         *
         * You may access this client via the `auctionHouse()` method of your `Metaplex` instance.
         *
         * ```ts
         * const auctionHouseClient = metaplex.auctionHouse();
         * ```
         *
         * @example
         * You can create a new Auction House with minimum input like so.
         * By default, the current identity of the Metaplex instance will be
         * the authority of the Auction House.
         *
         * ```ts
         * const { auctionHouse } = await metaplex
         *   .auctionHouse()
         *   .create({
         *     sellerFeeBasisPoints: 500, // 5% royalties
         *   };
         * ```
         *
         * @see {@link AuctionHouse} The `AuctionHouse` model
         * @group Modules
         */
        createdAt: import("../../types").DateTime;
        canceledAt: import("../..").Option<import("../../types").DateTime>;
    } & {
        isPublic: false;
        asset: import("..").SftWithToken | import("..").NftWithToken;
    }> | Readonly<{
        model: "bid";
        lazy: false;
        auctionHouse: import("./models").AuctionHouse;
        tradeStateAddress: import("../../types").Pda;
        buyerAddress: import("@solana/web3.js").PublicKey;
        bookkeeperAddress: import("../..").Option<import("@solana/web3.js").PublicKey>;
        receiptAddress: import("../..").Option<import("../../types").Pda>;
        purchaseReceiptAddress: import("../..").Option<import("@solana/web3.js").PublicKey>;
        price: import("../../types").SolAmount | import("../../types").SplTokenAmount;
        tokens: import("../../types").SplTokenAmount;
        /**
         * This is a client for the Auction House module.
         *
         * It enables us to interact with the Auction House program in order to
         * create and update Auction House to configure a marketplace as well to allow
         * users to list, bid and execute sales.
         *
         * You may access this client via the `auctionHouse()` method of your `Metaplex` instance.
         *
         * ```ts
         * const auctionHouseClient = metaplex.auctionHouse();
         * ```
         *
         * @example
         * You can create a new Auction House with minimum input like so.
         * By default, the current identity of the Metaplex instance will be
         * the authority of the Auction House.
         *
         * ```ts
         * const { auctionHouse } = await metaplex
         *   .auctionHouse()
         *   .create({
         *     sellerFeeBasisPoints: 500, // 5% royalties
         *   };
         * ```
         *
         * @see {@link AuctionHouse} The `AuctionHouse` model
         * @group Modules
         */
        createdAt: import("../../types").DateTime;
        canceledAt: import("../..").Option<import("../../types").DateTime>;
    } & {
        isPublic: true;
        asset: import("..").Sft | import("..").Nft;
    }>>;
    /** {@inheritDoc findBidsByPublicKeyFieldOperation} */
    findBidsBy(input: FindBidsByPublicKeyFieldInput, options?: OperationOptions): Promise<import("./operations").FindBidsByPublicKeyFieldOutput>;
    /** {@inheritDoc findListingByTradeStateOperation} */
    findListingByTradeState(input: FindListingByTradeStateInput, options?: OperationOptions): Promise<Readonly<{
        model: "listing";
        lazy: false;
        auctionHouse: import("./models").AuctionHouse;
        asset: import("..").SftWithToken | import("..").NftWithToken;
        tradeStateAddress: import("../../types").Pda;
        sellerAddress: import("@solana/web3.js").PublicKey;
        bookkeeperAddress: import("../..").Option<import("@solana/web3.js").PublicKey>;
        receiptAddress: import("../..").Option<import("../../types").Pda>;
        purchaseReceiptAddress: import("../..").Option<import("@solana/web3.js").PublicKey>;
        price: import("../../types").SolAmount | import("../../types").SplTokenAmount;
        tokens: import("../../types").SplTokenAmount;
        createdAt: import("../../types").DateTime;
        canceledAt: import("../..").Option<import("../../types").DateTime>;
    }>>;
    /** {@inheritDoc findListingByReceiptOperation} */
    findListingByReceipt(input: FindListingByReceiptInput, options?: OperationOptions): Promise<Readonly<{
        model: "listing";
        lazy: false;
        auctionHouse: import("./models").AuctionHouse;
        asset: import("..").SftWithToken | import("..").NftWithToken;
        tradeStateAddress: import("../../types").Pda;
        sellerAddress: import("@solana/web3.js").PublicKey;
        bookkeeperAddress: import("../..").Option<import("@solana/web3.js").PublicKey>;
        receiptAddress: import("../..").Option<import("../../types").Pda>;
        purchaseReceiptAddress: import("../..").Option<import("@solana/web3.js").PublicKey>;
        price: import("../../types").SolAmount | import("../../types").SplTokenAmount;
        tokens: import("../../types").SplTokenAmount;
        createdAt: import("../../types").DateTime;
        canceledAt: import("../..").Option<import("../../types").DateTime>;
    }>>;
    /** {@inheritDoc findListingsByPublicKeyFieldOperation} */
    findListingsBy(input: FindListingsByPublicKeyFieldInput, options?: OperationOptions): Promise<import("./operations").FindListingsByPublicKeyFieldOutput>;
    /** {@inheritDoc findPurchaseByTradeStateOperation} */
    findPurchaseByTradeState(input: FindPurchaseByTradeStateInput, options?: OperationOptions): Promise<Readonly<{
        model: "purchase";
        lazy: false;
        auctionHouse: import("./models").AuctionHouse;
        asset: import("..").SftWithToken | import("..").NftWithToken;
        buyerAddress: import("@solana/web3.js").PublicKey;
        sellerAddress: import("@solana/web3.js").PublicKey;
        bookkeeperAddress: import("../..").Option<import("@solana/web3.js").PublicKey>;
        receiptAddress: import("../..").Option<import("@solana/web3.js").PublicKey>;
        price: import("../../types").SolAmount | import("../../types").SplTokenAmount;
        tokens: import("../../types").SplTokenAmount;
        createdAt: import("../../types").DateTime;
    }>>;
    /** {@inheritDoc findPurchaseByReceiptOperation} */
    findPurchaseByReceipt(input: FindPurchaseByReceiptInput, options?: OperationOptions): Promise<Readonly<{
        model: "purchase";
        lazy: false;
        auctionHouse: import("./models").AuctionHouse;
        asset: import("..").SftWithToken | import("..").NftWithToken;
        buyerAddress: import("@solana/web3.js").PublicKey;
        sellerAddress: import("@solana/web3.js").PublicKey;
        bookkeeperAddress: import("../..").Option<import("@solana/web3.js").PublicKey>;
        receiptAddress: import("../..").Option<import("@solana/web3.js").PublicKey>;
        price: import("../../types").SolAmount | import("../../types").SplTokenAmount;
        tokens: import("../../types").SplTokenAmount;
        createdAt: import("../../types").DateTime;
    }>>;
    /** {@inheritDoc findPurchasesByPublicKeyFieldOperation} */
    findPurchasesBy(input: FindPurchasesByPublicKeyFieldInput, options?: OperationOptions): Promise<import("./operations").FindPurchasesByPublicKeyFieldOutput>;
    /** {@inheritDoc getBuyerBalanceOperation} */
    getBuyerBalance(input: GetBuyerBalanceInput, options?: OperationOptions): Promise<import("../../types").SolAmount>;
    /** {@inheritDoc createListingOperation} */
    list(input: CreateListingInput, options?: OperationOptions): Promise<import("./operations").CreateListingOutput>;
    /** {@inheritDoc loadBidOperation} */
    loadBid(input: LoadBidInput, options?: OperationOptions): Promise<Readonly<{
        model: "bid";
        lazy: false;
        auctionHouse: import("./models").AuctionHouse;
        tradeStateAddress: import("../../types").Pda;
        buyerAddress: import("@solana/web3.js").PublicKey;
        bookkeeperAddress: import("../..").Option<import("@solana/web3.js").PublicKey>;
        receiptAddress: import("../..").Option<import("../../types").Pda>;
        purchaseReceiptAddress: import("../..").Option<import("@solana/web3.js").PublicKey>;
        price: import("../../types").SolAmount | import("../../types").SplTokenAmount;
        tokens: import("../../types").SplTokenAmount;
        /**
         * This is a client for the Auction House module.
         *
         * It enables us to interact with the Auction House program in order to
         * create and update Auction House to configure a marketplace as well to allow
         * users to list, bid and execute sales.
         *
         * You may access this client via the `auctionHouse()` method of your `Metaplex` instance.
         *
         * ```ts
         * const auctionHouseClient = metaplex.auctionHouse();
         * ```
         *
         * @example
         * You can create a new Auction House with minimum input like so.
         * By default, the current identity of the Metaplex instance will be
         * the authority of the Auction House.
         *
         * ```ts
         * const { auctionHouse } = await metaplex
         *   .auctionHouse()
         *   .create({
         *     sellerFeeBasisPoints: 500, // 5% royalties
         *   };
         * ```
         *
         * @see {@link AuctionHouse} The `AuctionHouse` model
         * @group Modules
         */
        createdAt: import("../../types").DateTime;
        canceledAt: import("../..").Option<import("../../types").DateTime>;
    } & {
        isPublic: false;
        asset: import("..").SftWithToken | import("..").NftWithToken;
    }> | Readonly<{
        model: "bid";
        lazy: false;
        auctionHouse: import("./models").AuctionHouse;
        tradeStateAddress: import("../../types").Pda;
        buyerAddress: import("@solana/web3.js").PublicKey;
        bookkeeperAddress: import("../..").Option<import("@solana/web3.js").PublicKey>;
        receiptAddress: import("../..").Option<import("../../types").Pda>;
        purchaseReceiptAddress: import("../..").Option<import("@solana/web3.js").PublicKey>;
        price: import("../../types").SolAmount | import("../../types").SplTokenAmount;
        tokens: import("../../types").SplTokenAmount;
        /**
         * This is a client for the Auction House module.
         *
         * It enables us to interact with the Auction House program in order to
         * create and update Auction House to configure a marketplace as well to allow
         * users to list, bid and execute sales.
         *
         * You may access this client via the `auctionHouse()` method of your `Metaplex` instance.
         *
         * ```ts
         * const auctionHouseClient = metaplex.auctionHouse();
         * ```
         *
         * @example
         * You can create a new Auction House with minimum input like so.
         * By default, the current identity of the Metaplex instance will be
         * the authority of the Auction House.
         *
         * ```ts
         * const { auctionHouse } = await metaplex
         *   .auctionHouse()
         *   .create({
         *     sellerFeeBasisPoints: 500, // 5% royalties
         *   };
         * ```
         *
         * @see {@link AuctionHouse} The `AuctionHouse` model
         * @group Modules
         */
        createdAt: import("../../types").DateTime;
        canceledAt: import("../..").Option<import("../../types").DateTime>;
    } & {
        isPublic: true;
        asset: import("..").Sft | import("..").Nft;
    }>>;
    /** {@inheritDoc loadListingOperation} */
    loadListing(input: LoadListingInput, options?: OperationOptions): Promise<Readonly<{
        model: "listing";
        lazy: false;
        auctionHouse: import("./models").AuctionHouse;
        asset: import("..").SftWithToken | import("..").NftWithToken;
        tradeStateAddress: import("../../types").Pda;
        sellerAddress: import("@solana/web3.js").PublicKey;
        bookkeeperAddress: import("../..").Option<import("@solana/web3.js").PublicKey>;
        receiptAddress: import("../..").Option<import("../../types").Pda>;
        purchaseReceiptAddress: import("../..").Option<import("@solana/web3.js").PublicKey>;
        price: import("../../types").SolAmount | import("../../types").SplTokenAmount;
        tokens: import("../../types").SplTokenAmount;
        createdAt: import("../../types").DateTime;
        canceledAt: import("../..").Option<import("../../types").DateTime>;
    }>>;
    /** {@inheritDoc loadPurchaseOperation} */
    loadPurchase(input: LoadPurchaseInput, options?: OperationOptions): Promise<Readonly<{
        model: "purchase";
        lazy: false;
        auctionHouse: import("./models").AuctionHouse;
        asset: import("..").SftWithToken | import("..").NftWithToken;
        buyerAddress: import("@solana/web3.js").PublicKey;
        sellerAddress: import("@solana/web3.js").PublicKey;
        bookkeeperAddress: import("../..").Option<import("@solana/web3.js").PublicKey>;
        receiptAddress: import("../..").Option<import("@solana/web3.js").PublicKey>;
        price: import("../../types").SolAmount | import("../../types").SplTokenAmount;
        tokens: import("../../types").SplTokenAmount;
        createdAt: import("../../types").DateTime;
    }>>;
    /** {@inheritDoc saleOperation} */
    sell(input: DirectSellInput, options?: OperationOptions): Promise<import("./operations").DirectSellOutput>;
    /** {@inheritDoc updateAuctionHouseOperation} */
    update(input: UpdateAuctionHouseInput, options?: OperationOptions): Promise<import("./operations").UpdateAuctionHouseOutput>;
    /** {@inheritDoc withdrawFromBuyerAccountOperation} */
    withdrawFromBuyerAccount(input: WithdrawFromBuyerAccountInput, options?: OperationOptions): Promise<import("./operations").WithdrawFromBuyerAccountOutput>;
    /** {@inheritDoc withdrawFromFeeAccountOperation} */
    withdrawFromFeeAccount(input: WithdrawFromFeeAccountInput, options?: OperationOptions): Promise<import("./operations").WithdrawFromFeeAccountOutput>;
    /** {@inheritDoc withdrawFromTreasuryAccountOperation} */
    withdrawFromTreasuryAccount(input: WithdrawFromTreasuryAccountInput, options?: OperationOptions): Promise<import("./operations").WithdrawFromTreasuryAccountOutput>;
}
