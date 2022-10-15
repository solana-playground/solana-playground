import { PublicKey } from '@solana/web3.js';
import { PurchaseReceiptAccount } from '../accounts';
import { NftWithToken, SftWithToken } from '../../nftModule';
import { AuctionHouse } from './AuctionHouse';
import { BigNumber, DateTime, SolAmount, SplTokenAmount } from '../../../types';
import { Option } from '../../../utils';
export declare type Purchase = Readonly<{
    /** A model identifier to distinguish models in the SDK. */
    model: 'purchase';
    /**
     * Whether or not the asset was loaded.
     * When this is `false`, it means the Purchase includes asset model.
     */
    lazy: false;
    /** A model of the Auction House related to this purchase. */
    auctionHouse: AuctionHouse;
    /** The Nft or Sft with the associated token account. */
    asset: SftWithToken | NftWithToken;
    /** The address of the buyer's wallet. */
    buyerAddress: PublicKey;
    /** The address of the seller's wallet. */
    sellerAddress: PublicKey;
    /**
     * The address of the bookkeeper account.
     * It is responsible for signing a Purchase Receipt Print.
     */
    bookkeeperAddress: Option<PublicKey>;
    /**
     * The address of the purchase receipt account.
     * This is the account that stores information about this purchase.
     * The Purchase model is built on top of this account.
     */
    receiptAddress: Option<PublicKey>;
    /** The number of tokens spent on this purchase. */
    price: SolAmount | SplTokenAmount;
    /** The number of tokens bought in case it's a sale of a Fungible Token. */
    tokens: SplTokenAmount;
    /** The date of creation. */
    createdAt: DateTime;
}>;
export declare const isPurchase: (value: any) => value is Readonly<{
    /** A model identifier to distinguish models in the SDK. */
    model: 'purchase';
    /**
     * Whether or not the asset was loaded.
     * When this is `false`, it means the Purchase includes asset model.
     */
    lazy: false;
    /** A model of the Auction House related to this purchase. */
    auctionHouse: AuctionHouse;
    /** The Nft or Sft with the associated token account. */
    asset: SftWithToken | NftWithToken;
    /** The address of the buyer's wallet. */
    buyerAddress: PublicKey;
    /** The address of the seller's wallet. */
    sellerAddress: PublicKey;
    /**
     * The address of the bookkeeper account.
     * It is responsible for signing a Purchase Receipt Print.
     */
    bookkeeperAddress: Option<PublicKey>;
    /**
     * The address of the purchase receipt account.
     * This is the account that stores information about this purchase.
     * The Purchase model is built on top of this account.
     */
    receiptAddress: Option<PublicKey>;
    /** The number of tokens spent on this purchase. */
    price: SolAmount | SplTokenAmount;
    /** The number of tokens bought in case it's a sale of a Fungible Token. */
    tokens: SplTokenAmount;
    /** The date of creation. */
    createdAt: DateTime;
}>;
export declare function assertPurchase(value: any): asserts value is Purchase;
export declare const toPurchase: (account: PurchaseReceiptAccount, auctionHouseModel: AuctionHouse, asset: NftWithToken | SftWithToken) => Purchase;
export declare type LazyPurchase = Omit<Purchase, 'lazy' | 'asset' | 'tokens'> & Readonly<{
    lazy: true;
    metadataAddress: PublicKey;
    tokens: BigNumber;
}>;
export declare const isLazyPurchase: (value: any) => value is LazyPurchase;
export declare function assertLazyPurchase(value: any): asserts value is LazyPurchase;
export declare const toLazyPurchase: (account: PurchaseReceiptAccount, auctionHouseModel: AuctionHouse) => LazyPurchase;
