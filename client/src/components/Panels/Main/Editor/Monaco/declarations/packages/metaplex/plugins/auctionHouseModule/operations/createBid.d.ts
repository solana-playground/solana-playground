import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { AuctionHouse, Bid } from '../models';
import { Option, TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
import { Operation, OperationHandler, Pda, Signer, SolAmount, SplTokenAmount } from '../../../types';
import type { Metaplex } from '../../../Metaplex';
declare const Key: "CreateBidOperation";
/**
 * Creates a bid on a given asset.
 *
 * You can post a public bid on a non-listed NFT by skipping seller and tokenAccount properties.
 * Public bids are specific to the token itself and not to any specific auction.
 * This means that a bid can stay active beyond the end of an auction
 * and be resolved if it meets the criteria for subsequent auctions of that token.
 *
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .createBid({ auctionHouse, mintAccount, seller };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const createBidOperation: import("../../../types").OperationConstructor<CreateBidOperation, "CreateBidOperation", CreateBidInput, CreateBidOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type CreateBidOperation = Operation<typeof Key, CreateBidInput, CreateBidOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type CreateBidInput = {
    /** The Auction House in which to create a Bid. */
    auctionHouse: AuctionHouse;
    /**
     * Creator of a bid.
     *
     * @defaultValue `metaplex.identity()`
     */
    buyer?: Signer;
    /**
     * The Auction House authority.
     * If this is Signer the transaction fee
     * will be paid from the Auction House Fee Account
     *
     * @defaultValue `auctionHouse.authority`
     */
    authority?: PublicKey | Signer;
    /**
     * The Auctioneer authority key.
     * It is required when Auction House has Auctioneer enabled.
     *
     * @defaultValue No default value.
     */
    auctioneerAuthority?: Signer;
    /**
     * The mint account to create a bid for.
     * This is used to find the metadata.
     */
    mintAccount: PublicKey;
    /**
     * The account address that holds the asset a bid created is for.
     * If this or tokenAccount isn't provided, then the bid will be public.
     *
     * @defaultValue No default value.
     */
    seller?: Option<PublicKey>;
    /**
     * The token account address that's associated to the asset a bid created is for.
     * If this or seller isn't provided, then the bid will be public.
     *
     * @defaultValue No default value.
     */
    tokenAccount?: Option<PublicKey>;
    /**
     * The buyer's price.
     *
     * @defaultValue 0 SOLs or tokens.
     */
    price?: SolAmount | SplTokenAmount;
    /**
     * The number of tokens to bid for.
     * For an NFT bid it must be 1 token.
     *
     * When a Fungible Asset is put on sale.
     * The buyer can then create a buy order of said assets that is
     * less than the token_size of the sell order.
     *
     * @defaultValue 1 token.
     */
    tokens?: SplTokenAmount;
    /**
     * Prints the bid receipt.
     * The receipt holds information about the bid,
     * So it's important to print it if you want to use the `Bid` model
     *
     * The receipt printing is skipped for the Auctioneer Auction House
     * Since it currently doesn't support it.
     *
     * @defaultValue `true`
     */
    printReceipt?: boolean;
    /**
     * The address of the bookkeeper wallet responsible for the receipt.
     *
     * @defaultValue `metaplex.identity()`
     */
    bookkeeper?: Signer;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type CreateBidOutput = {
    /** Buyer trade state account PDA encoding the bid order. */
    buyerTradeState: Pda;
    /** The asset's token account address in case the bid is private. */
    tokenAccount: Option<PublicKey>;
    /** The asset's metadata PDA. */
    metadata: Pda;
    /** The potential buyer of the asset. */
    buyer: PublicKey;
    /** The PDA of the receipt account in case it was printed. */
    receipt: Option<Pda>;
    /** The address of the bookkeeper wallet responsible for the receipt. */
    bookkeeper: Option<PublicKey>;
    /** The buyer's price. */
    price: SolAmount | SplTokenAmount;
    /** The number of tokens to bid for. */
    tokens: SplTokenAmount;
    /** A model that keeps information about the Bid. */
    bid: Bid;
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const createBidOperationHandler: OperationHandler<CreateBidOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type CreateBidBuilderParams = Omit<CreateBidInput, 'confirmOptions'> & {
    instructionKey?: string;
};
/**
 * @group Transaction Builders
 * @category Contexts
 */
export declare type CreateBidBuilderContext = Omit<CreateBidOutput, 'response' | 'bid'>;
/**
 * Creates a bid on a given asset.
 *
 * You can post a public bid on a non-listed NFT by skipping seller and tokenAccount properties.
 * Public bids are specific to the token itself and not to any specific auction.
 * This means that a bid can stay active beyond the end of an auction
 * and be resolved if it meets the criteria for subsequent auctions of that token.
 *
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .auctionHouse()
 *   .builders()
 *   .createBid({ auctionHouse, mintAccount, seller })
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const createBidBuilder: (metaplex: Metaplex, params: CreateBidBuilderParams, options?: TransactionBuilderOptions) => Promise<TransactionBuilder<CreateBidBuilderContext>>;
export {};
