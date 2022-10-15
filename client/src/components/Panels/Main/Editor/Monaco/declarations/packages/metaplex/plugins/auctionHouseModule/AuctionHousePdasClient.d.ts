import type { Metaplex } from '../../Metaplex';
import { BigNumber, Pda, Program, PublicKey } from '../../types';
import { Option } from '../../utils';
/**
 * This client allows you to build PDAs related to the Auction House module.
 *
 * @see {@link AuctionHouseClient}
 * @group Module Pdas
 */
export declare class AuctionHousePdasClient {
    protected readonly metaplex: Metaplex;
    constructor(metaplex: Metaplex);
    /** Finds the Auction House PDA for a creator and treasury tuple. */
    auctionHouse(input: {
        /** The address of the Auction House's creator. */
        creator: PublicKey;
        /** The mint address of the Auction House's treasury. */
        treasuryMint: PublicKey;
        /** An optional set of programs that override the registered ones. */
        programs?: Program[];
    }): Pda;
    /** Finds the Auctioneer PDA of an Auction House. */
    auctioneer(input: {
        /** The Auction House address. */
        auctionHouse: PublicKey;
        /** The address of the Auctioneer authority. */
        auctioneerAuthority: PublicKey;
        /** An optional set of programs that override the registered ones. */
        programs?: Program[];
    }): Pda;
    /**
     * Finds the PDA of the Auction House Program
     * itself used to sign transaction.
     */
    programAsSigner(input?: {
        /** An optional set of programs that override the registered ones. */
        programs?: Program[];
    }): Pda;
    /** Finds the PDA of an Auction House's fee account. */
    fee(input: {
        /** The Auction House address. */
        auctionHouse: PublicKey;
        /** An optional set of programs that override the registered ones. */
        programs?: Program[];
    }): Pda;
    /** Finds the PDA of an Auction House's treasury account. */
    treasury(input: {
        /** The Auction House address. */
        auctionHouse: PublicKey;
        /** An optional set of programs that override the registered ones. */
        programs?: Program[];
    }): Pda;
    /** Finds the PDA of a buyer's escrow account. */
    buyerEscrow(input: {
        /** The Auction House address. */
        auctionHouse: PublicKey;
        /** The address of the buyer. */
        buyer: PublicKey;
        /** An optional set of programs that override the registered ones. */
        programs?: Program[];
    }): Pda;
    /** Finds the trade state PDA of a bid or listing. */
    tradeState(input: {
        /** The Auction House address. */
        auctionHouse: PublicKey;
        /** The address of the buyer or seller. */
        wallet: PublicKey;
        /** The mint address of the Auction House's treasury at the time of trade. */
        treasuryMint: PublicKey;
        /** The mint address of the token to trade. */
        tokenMint: PublicKey;
        /** The price of the trade in basis points. */
        price: BigNumber;
        /** The number of tokens to trade in basis points. */
        tokenSize: BigNumber;
        /** The token account from which to trade, unless it is a public bid. */
        tokenAccount?: Option<PublicKey>;
        /** An optional set of programs that override the registered ones. */
        programs?: Program[];
    }): Pda;
    /** Finds the receipt PDA of a Listing trade state. */
    listingReceipt(input: {
        /** The trade state PDA of the Listing. */
        tradeState: PublicKey;
        /** An optional set of programs that override the registered ones. */
        programs?: Program[];
    }): Pda;
    /** Finds the receipt PDA of a Bid trade state. */
    bidReceipt(input: {
        /** The trade state PDA of the Bid. */
        tradeState: PublicKey;
        /** An optional set of programs that override the registered ones. */
        programs?: Program[];
    }): Pda;
    /** Finds the receipt PDA of a Purchase. */
    purchaseReceipt(input: {
        /** The trade state PDA of the Listing. */
        listingTradeState: PublicKey;
        /** The trade state PDA of the Bid. */
        bidTradeState: PublicKey;
        /** An optional set of programs that override the registered ones. */
        programs?: Program[];
    }): Pda;
    private programId;
}
