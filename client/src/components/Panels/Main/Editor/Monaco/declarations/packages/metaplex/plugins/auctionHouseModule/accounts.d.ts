import { Auctioneer, AuctionHouse, ListingReceipt, BidReceipt, PurchaseReceipt } from '@metaplex-foundation/mpl-auction-house';
import { Account } from '../../types';
/** @group Accounts */
export declare type AuctioneerAccount = Account<Auctioneer>;
/** @group Account Helpers */
export declare const parseAuctioneerAccount: import("../../types").AccountParsingFunction<Auctioneer>;
/** @group Account Helpers */
export declare const toAuctioneerAccount: import("../../types").AccountParsingAndAssertingFunction<Auctioneer>;
/** @group Accounts */
export declare type AuctionHouseAccount = Account<AuctionHouse>;
/** @group Account Helpers */
export declare const parseAuctionHouseAccount: import("../../types").AccountParsingFunction<AuctionHouse>;
/** @group Account Helpers */
export declare const toAuctionHouseAccount: import("../../types").AccountParsingAndAssertingFunction<AuctionHouse>;
/** @group Accounts */
export declare type ListingReceiptAccount = Account<ListingReceipt>;
/** @group Account Helpers */
export declare const parseListingReceiptAccount: import("../../types").AccountParsingFunction<ListingReceipt>;
/** @group Account Helpers */
export declare const toListingReceiptAccount: import("../../types").AccountParsingAndAssertingFunction<ListingReceipt>;
/** @group Accounts */
export declare type BidReceiptAccount = Account<BidReceipt>;
/** @group Account Helpers */
export declare const parseBidReceiptAccount: import("../../types").AccountParsingFunction<BidReceipt>;
/** @group Account Helpers */
export declare const toBidReceiptAccount: import("../../types").AccountParsingAndAssertingFunction<BidReceipt>;
/** @group Accounts */
export declare type PurchaseReceiptAccount = Account<PurchaseReceipt>;
/** @group Account Helpers */
export declare const parsePurchaseReceiptAccount: import("../../types").AccountParsingFunction<PurchaseReceipt>;
/** @group Account Helpers */
export declare const toPurchaseReceiptAccount: import("../../types").AccountParsingAndAssertingFunction<PurchaseReceipt>;
