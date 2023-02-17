import { AuthorityScope } from '@metaplex-foundation/mpl-auction-house';
import type { PublicKey } from '@solana/web3.js';
import { AuctioneerAccount, AuctionHouseAccount } from '../accounts';
import { Mint } from '../../tokenModule';
import { Pda } from '../../../types';
export declare type AuctionHouse = Readonly<{
    /** A model identifier to distinguish models in the SDK. */
    model: 'auctionHouse';
    /** The address of the Auction House. */
    address: Pda;
    /** The address of the Auction House creator. */
    creatorAddress: PublicKey;
    /** The address of the authority that is allowed to manage this Auction House. */
    authorityAddress: PublicKey;
    /**
     * The address of the Auction House treasury mint.
     * The token you accept as the purchase currency.
     * By default Auction House uses the `WRAPPED_SOL_MINT` treasury mint.
     */
    treasuryMint: Mint;
    /** The account that used to pay the fees for selling and buying. */
    feeAccountAddress: Pda;
    /** The account that receives the AuctionHouse fees. */
    treasuryAccountAddress: Pda;
    /** The account that is marked as a destination of withdrawal from the fee account. */
    feeWithdrawalDestinationAddress: PublicKey;
    /** The account that is marked as a destination of withdrawal from the treasury account. */
    treasuryWithdrawalDestinationAddress: PublicKey;
    /** The share of the sale the auction house takes on all NFTs as a fee. */
    sellerFeeBasisPoints: number;
    /** This allows the centralised authority to gate which NFT can be listed, bought and sold. */
    requiresSignOff: boolean;
    /**
     * Is intended to be used with the Auction House that requires sign off.
     * If the seller intentionally lists their NFT for a price of 0, a new FreeSellerTradeState is made.
     * The Auction House can then change the price to match a matching Bid that is greater than 0.
     */
    canChangeSalePrice: boolean;
    /**
     * If this is true, then it means that Auction House accepts SOL as the purchase currency.
     * In other case, different SPL token is set as the purchase currency.
     */
    isNative: boolean;
} & ({
    /** This Auction House doesn't have Auctioneer. */
    hasAuctioneer: false;
} | {
    /**
     * This Auction House has Auctioneer enabled.
     * It allows timed auctions, minimum bid prices, and highest bid tracking.
     */
    hasAuctioneer: true;
    auctioneer: {
        /** The address of Auctioneer instance. */
        address: PublicKey;
        /** The address of Auctioneer Authority. */
        authority: PublicKey;
        /**
         * The list of scopes available to the user in the Auctioneer.
         * For example Bid, List, Execute Sale.
         */
        scopes: AuthorityScope[];
    };
})>;
/** @group Model Helpers */
export declare const isAuctionHouse: (value: any) => value is AuctionHouse;
/** @group Model Helpers */
export declare function assertAuctionHouse(value: any): asserts value is AuctionHouse;
export declare type AuctioneerAuctionHouse = AuctionHouse & {
    hasAuctioneer: true;
};
/** @group Model Helpers */
export declare const isAuctioneerAuctionHouse: (value: any) => value is Readonly<{
    /** A model identifier to distinguish models in the SDK. */
    model: 'auctionHouse';
    /** The address of the Auction House. */
    address: Pda;
    /** The address of the Auction House creator. */
    creatorAddress: PublicKey;
    /** The address of the authority that is allowed to manage this Auction House. */
    authorityAddress: PublicKey;
    /**
     * The address of the Auction House treasury mint.
     * The token you accept as the purchase currency.
     * By default Auction House uses the `WRAPPED_SOL_MINT` treasury mint.
     */
    treasuryMint: Mint;
    /** The account that used to pay the fees for selling and buying. */
    feeAccountAddress: Pda;
    /** The account that receives the AuctionHouse fees. */
    treasuryAccountAddress: Pda;
    /** The account that is marked as a destination of withdrawal from the fee account. */
    feeWithdrawalDestinationAddress: PublicKey;
    /** The account that is marked as a destination of withdrawal from the treasury account. */
    treasuryWithdrawalDestinationAddress: PublicKey;
    /** The share of the sale the auction house takes on all NFTs as a fee. */
    sellerFeeBasisPoints: number;
    /** This allows the centralised authority to gate which NFT can be listed, bought and sold. */
    requiresSignOff: boolean;
    /**
     * Is intended to be used with the Auction House that requires sign off.
     * If the seller intentionally lists their NFT for a price of 0, a new FreeSellerTradeState is made.
     * The Auction House can then change the price to match a matching Bid that is greater than 0.
     */
    canChangeSalePrice: boolean;
    /**
     * If this is true, then it means that Auction House accepts SOL as the purchase currency.
     * In other case, different SPL token is set as the purchase currency.
     */
    isNative: boolean;
} & {
    /**
     * This Auction House has Auctioneer enabled.
     * It allows timed auctions, minimum bid prices, and highest bid tracking.
     */
    hasAuctioneer: true;
    auctioneer: {
        /** The address of Auctioneer instance. */
        address: PublicKey;
        /** The address of Auctioneer Authority. */
        authority: PublicKey;
        /**
         * The list of scopes available to the user in the Auctioneer.
         * For example Bid, List, Execute Sale.
         */
        scopes: AuthorityScope[];
    };
}> & {
    hasAuctioneer: true;
};
/** @group Model Helpers */
export declare function assertAuctioneerAuctionHouse(value: any): asserts value is AuctioneerAuctionHouse;
/** @group Model Helpers */
export declare const toAuctionHouse: (auctionHouseAccount: AuctionHouseAccount, treasuryMint: Mint, auctioneerAccount?: AuctioneerAccount | null | undefined) => AuctionHouse;
