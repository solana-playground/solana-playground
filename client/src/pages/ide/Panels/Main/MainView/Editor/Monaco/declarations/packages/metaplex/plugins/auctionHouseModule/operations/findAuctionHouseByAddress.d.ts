import type { PublicKey } from '@solana/web3.js';
import { AuctionHouse } from '../models/AuctionHouse';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "FindAuctionHouseByAddressOperation";
/**
 * Finds an Auction House by its address.
 *
 * ```ts
 * const nft = await metaplex
 *   .auctionHouse()
 *   .findByAddress({ address };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const findAuctionHouseByAddressOperation: import("../../../types").OperationConstructor<FindAuctionHouseByAddressOperation, "FindAuctionHouseByAddressOperation", FindAuctionHouseByAddressInput, Readonly<{
    model: "auctionHouse";
    address: import("../../../types").Pda;
    creatorAddress: PublicKey;
    authorityAddress: PublicKey;
    treasuryMint: import("../..").Mint;
    feeAccountAddress: import("../../../types").Pda;
    treasuryAccountAddress: import("../../../types").Pda;
    feeWithdrawalDestinationAddress: PublicKey;
    treasuryWithdrawalDestinationAddress: PublicKey;
    sellerFeeBasisPoints: number;
    requiresSignOff: boolean;
    canChangeSalePrice: boolean;
    isNative: boolean;
} & {
    hasAuctioneer: false;
}> | Readonly<{
    model: "auctionHouse";
    address: import("../../../types").Pda;
    creatorAddress: PublicKey;
    authorityAddress: PublicKey;
    treasuryMint: import("../..").Mint;
    feeAccountAddress: import("../../../types").Pda;
    treasuryAccountAddress: import("../../../types").Pda;
    feeWithdrawalDestinationAddress: PublicKey;
    treasuryWithdrawalDestinationAddress: PublicKey;
    sellerFeeBasisPoints: number;
    requiresSignOff: boolean;
    canChangeSalePrice: boolean;
    isNative: boolean;
} & {
    hasAuctioneer: true;
    auctioneer: {
        address: PublicKey;
        authority: PublicKey;
        scopes: import("@metaplex-foundation/mpl-auction-house").AuthorityScope[];
    };
}>>;
/**
 * @group Operations
 * @category Types
 */
export declare type FindAuctionHouseByAddressOperation = Operation<typeof Key, FindAuctionHouseByAddressInput, AuctionHouse>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FindAuctionHouseByAddressInput = {
    /** The address of the Auction House. */
    address: PublicKey;
    /**
     * The Auctioneer authority key.
     * It is required when Auction House has Auctioneer enabled.
     *
     * @defaultValue No default value.
     */
    auctioneerAuthority?: PublicKey;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const findAuctionHouseByAddressOperationHandler: OperationHandler<FindAuctionHouseByAddressOperation>;
export {};
