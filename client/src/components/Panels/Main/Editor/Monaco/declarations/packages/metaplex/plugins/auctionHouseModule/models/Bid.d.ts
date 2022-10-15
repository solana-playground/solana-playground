import { PublicKey } from '@solana/web3.js';
import { BidReceiptAccount } from '../accounts';
import { Nft, NftWithToken, Sft, SftWithToken } from '../../nftModule';
import { AuctionHouse } from './AuctionHouse';
import { BigNumber, DateTime, Pda, SolAmount, SplTokenAmount } from '../../../types';
import { Option } from '../../../utils';
/** @group Models */
export declare type Bid = Readonly<{
    /** A model identifier to distinguish models in the SDK. */
    model: 'bid';
    /**
     * Whether or not the asset was loaded.
     * When this is `false`, it means the Bid includes asset model.
     */
    lazy: false;
    /** A model of the Auction House related to this bid. */
    auctionHouse: AuctionHouse;
    /** The address of the buyer's trade state account. */
    tradeStateAddress: Pda;
    /** The address of the buyer's wallet. */
    buyerAddress: PublicKey;
    /**
     * The address of the bookkeeper account.
     * It is responsible for signing a Bid Receipt Print.
     */
    bookkeeperAddress: Option<PublicKey>;
    /**
     * The address of the bid receipt account.
     * This is the account that stores information about this bid.
     * The Bid model is built on top of this account.
     */
    receiptAddress: Option<Pda>;
    /**
     * The address of the purchase receipt account.
     * This is the account that stores information about the purchase related to this bid.
     *
     * ```ts
     * const transactionBuilder = metaplex
     *   .auctionHouse()
     *   .builders()
     *   .findPurchaseByReceipt({ auctionHouse, receiptAddress: purchaseReceiptAddress });
     * ```
     */
    purchaseReceiptAddress: Option<PublicKey>;
    /** The buyer's price. */
    price: SolAmount | SplTokenAmount;
    /** The number of tokens bid is for. */
    tokens: SplTokenAmount;
    /** The date of creation. */
    createdAt: DateTime;
    /** The date of cancellation. */
    canceledAt: Option<DateTime>;
} & ({
    /** The bid is not public, which means that it was created according to the listing. */
    isPublic: false;
    /** The Nft or Sft with the associated token account. */
    asset: SftWithToken | NftWithToken;
} | {
    /**
     * The bid is public.
     * This means that a bid can stay active beyond the end of an auction
     * and be resolved if it meets the criteria for subsequent auctions of that token.
     */
    isPublic: true;
    /** The Nft or Sft related to the Bid. */
    asset: Sft | Nft;
})>;
/** @group Model Helpers */
export declare const isBid: (value: any) => value is Bid;
/** @group Model Helpers */
export declare function assertBid(value: any): asserts value is Bid;
/** @group Model Helpers */
export declare const toBid: (account: BidReceiptAccount, auctionHouse: AuctionHouse, asset: Nft | Sft | NftWithToken | SftWithToken) => Bid;
/** @group Models */
export declare type PublicBid = Bid & {
    isPublic: true;
    asset: Sft | Nft;
};
/** @group Models */
export declare type PrivateBid = Bid & {
    isPublic: false;
    asset: SftWithToken | NftWithToken;
};
/** @group Model Helpers */
export declare const isPrivateBid: (value: any) => value is Readonly<{
    /** A model identifier to distinguish models in the SDK. */
    model: 'bid';
    /**
     * Whether or not the asset was loaded.
     * When this is `false`, it means the Bid includes asset model.
     */
    lazy: false;
    /** A model of the Auction House related to this bid. */
    auctionHouse: AuctionHouse;
    /** The address of the buyer's trade state account. */
    tradeStateAddress: Pda;
    /** The address of the buyer's wallet. */
    buyerAddress: PublicKey;
    /**
     * The address of the bookkeeper account.
     * It is responsible for signing a Bid Receipt Print.
     */
    bookkeeperAddress: Option<PublicKey>;
    /**
     * The address of the bid receipt account.
     * This is the account that stores information about this bid.
     * The Bid model is built on top of this account.
     */
    receiptAddress: Option<Pda>;
    /**
     * The address of the purchase receipt account.
     * This is the account that stores information about the purchase related to this bid.
     *
     * ```ts
     * const transactionBuilder = metaplex
     *   .auctionHouse()
     *   .builders()
     *   .findPurchaseByReceipt({ auctionHouse, receiptAddress: purchaseReceiptAddress });
     * ```
     */
    purchaseReceiptAddress: Option<PublicKey>;
    /** The buyer's price. */
    price: SolAmount | SplTokenAmount;
    /** The number of tokens bid is for. */
    tokens: SplTokenAmount;
    /** The date of creation. */
    createdAt: DateTime;
    /** The date of cancellation. */
    canceledAt: Option<DateTime>;
} & {
    /** The bid is not public, which means that it was created according to the listing. */
    isPublic: false;
    /** The Nft or Sft with the associated token account. */
    asset: SftWithToken | NftWithToken;
}> & {
    isPublic: false;
    asset: SftWithToken | NftWithToken;
};
export declare type LazyBid = Omit<Bid, 'lazy' | 'asset' | 'tokens'> & Readonly<{
    lazy: true;
    metadataAddress: PublicKey;
    tokenAddress: Option<PublicKey>;
    tokens: BigNumber;
}>;
/** @group Model Helpers */
export declare const isLazyBid: (value: any) => value is LazyBid;
/** @group Model Helpers */
export declare function assertLazyBid(value: any): asserts value is LazyBid;
/** @group Model Helpers */
export declare const toLazyBid: (account: BidReceiptAccount, auctionHouse: AuctionHouse) => LazyBid;
