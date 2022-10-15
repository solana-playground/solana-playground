import { PublicKey } from '@solana/web3.js';
import { ListingReceiptAccount } from '../accounts';
import { NftWithToken, SftWithToken } from '../../nftModule';
import { AuctionHouse } from './AuctionHouse';
import { Option } from '../../../utils';
import { BigNumber, DateTime, Pda, SolAmount, SplTokenAmount } from '../../../types';
/** @group Models */
export declare type Listing = Readonly<{
    /** A model identifier to distinguish models in the SDK. */
    model: 'listing';
    /**
     * Whether or not the asset was loaded.
     * When this is `false`, it means the Listing includes asset model.
     */
    lazy: false;
    /** A model of the Auction House related to this listing. */
    auctionHouse: AuctionHouse;
    /** The Nft or Sft with the associated token account. */
    asset: NftWithToken | SftWithToken;
    /** The address of the seller's trade state account. */
    tradeStateAddress: Pda;
    /** The address of the seller's wallet. */
    sellerAddress: PublicKey;
    /**
     * The address of the bookkeeper account.
     * It is responsible for signing a Listing Receipt Print.
     */
    bookkeeperAddress: Option<PublicKey>;
    /**
     * The address of the listing receipt account.
     * This is the account that stores information about this listing.
     * The Listing model is built on top of this account.
     */
    receiptAddress: Option<Pda>;
    /**
     * The address of the purchase receipt account.
     * This is the account that stores information about the purchase related to this listing.
     *
     * ```ts
     * const transactionBuilder = metaplex
     *   .auctionHouse()
     *   .builders()
     *   .findPurchaseByReceipt({ auctionHouse, receiptAddress: purchaseReceiptAddress });
     * ```
     */
    purchaseReceiptAddress: Option<PublicKey>;
    /** The sellers's price. */
    price: SolAmount | SplTokenAmount;
    /** The number of tokens listed in case it's a sale of a Fungible Token. */
    tokens: SplTokenAmount;
    /** The date of creation. */
    createdAt: DateTime;
    /** The date of cancellation. */
    canceledAt: Option<DateTime>;
}>;
/** @group Model Helpers */
export declare const isListing: (value: any) => value is Readonly<{
    /** A model identifier to distinguish models in the SDK. */
    model: 'listing';
    /**
     * Whether or not the asset was loaded.
     * When this is `false`, it means the Listing includes asset model.
     */
    lazy: false;
    /** A model of the Auction House related to this listing. */
    auctionHouse: AuctionHouse;
    /** The Nft or Sft with the associated token account. */
    asset: NftWithToken | SftWithToken;
    /** The address of the seller's trade state account. */
    tradeStateAddress: Pda;
    /** The address of the seller's wallet. */
    sellerAddress: PublicKey;
    /**
     * The address of the bookkeeper account.
     * It is responsible for signing a Listing Receipt Print.
     */
    bookkeeperAddress: Option<PublicKey>;
    /**
     * The address of the listing receipt account.
     * This is the account that stores information about this listing.
     * The Listing model is built on top of this account.
     */
    receiptAddress: Option<Pda>;
    /**
     * The address of the purchase receipt account.
     * This is the account that stores information about the purchase related to this listing.
     *
     * ```ts
     * const transactionBuilder = metaplex
     *   .auctionHouse()
     *   .builders()
     *   .findPurchaseByReceipt({ auctionHouse, receiptAddress: purchaseReceiptAddress });
     * ```
     */
    purchaseReceiptAddress: Option<PublicKey>;
    /** The sellers's price. */
    price: SolAmount | SplTokenAmount;
    /** The number of tokens listed in case it's a sale of a Fungible Token. */
    tokens: SplTokenAmount;
    /** The date of creation. */
    createdAt: DateTime;
    /** The date of cancellation. */
    canceledAt: Option<DateTime>;
}>;
/** @group Model Helpers */
export declare function assertListing(value: any): asserts value is Listing;
/** @group Model Helpers */
export declare const toListing: (account: ListingReceiptAccount, auctionHouse: AuctionHouse, asset: NftWithToken | SftWithToken) => Listing;
export declare type LazyListing = Omit<Listing, 'lazy' | 'asset' | 'tokens'> & Readonly<{
    lazy: true;
    metadataAddress: PublicKey;
    tokens: BigNumber;
}>;
/** @group Model Helpers */
export declare const isLazyListing: (value: any) => value is LazyListing;
/** @group Model Helpers */
export declare function assertLazyListing(value: any): asserts value is LazyListing;
/** @group Model Helpers */
export declare const toLazyListing: (account: ListingReceiptAccount, auctionHouse: AuctionHouse) => LazyListing;
