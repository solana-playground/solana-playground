import type { PublicKey } from '@solana/web3.js';
import { AuctionHouse } from '../models/AuctionHouse';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "FindAuctionHouseByCreatorAndMintOperation";
/**
 * Finds an Auction House by its creator and treasury mint.
 *
 * ```ts
 * const nft = await metaplex
 *   .auctionHouse()
 *   .findByCreatorAndMint({ creator, treasuryMint };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const findAuctionHouseByCreatorAndMintOperation: import("../../../types").OperationConstructor<FindAuctionHouseByCreatorAndMintOperation, "FindAuctionHouseByCreatorAndMintOperation", FindAuctionHouseByCreatorAndMintInput, Readonly<{
    model: "auctionHouse";
    address: import("../../../types").Pda;
    creatorAddress: PublicKey;
    authorityAddress: PublicKey;
    treasuryMint: import("../..").Mint;
    feeAccountAddress: import("../../../types").Pda;
    treasuryAccountAddress: import("../../../types").Pda;
    feeWithdrawalDestinationAddress: PublicKey;
    /**
     * The Auctioneer authority key.
     * It is required when Auction House has Auctioneer enabled.
     *
     * @defaultValue No default value.
     */
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
    /**
     * The Auctioneer authority key.
     * It is required when Auction House has Auctioneer enabled.
     *
     * @defaultValue No default value.
     */
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
export declare type FindAuctionHouseByCreatorAndMintOperation = Operation<typeof Key, FindAuctionHouseByCreatorAndMintInput, AuctionHouse>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FindAuctionHouseByCreatorAndMintInput = {
    /** The address of the Auction House creator. */
    creator: PublicKey;
    /**
     * The address of the Auction House treasury mint.
     * By default Auction House uses the `WRAPPED_SOL_MINT` treasury mint.
     */
    treasuryMint: PublicKey;
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
export declare const findAuctionHouseByCreatorAndMintOperationHandler: OperationHandler<FindAuctionHouseByCreatorAndMintOperation>;
export {};
