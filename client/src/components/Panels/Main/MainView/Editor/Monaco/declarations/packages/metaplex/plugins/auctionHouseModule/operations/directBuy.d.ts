import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { AuctionHouse, Bid, Listing, Purchase } from '../models';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
import { Operation, OperationHandler, Signer, SolAmount, SplTokenAmount } from '../../../types';
import type { Metaplex } from '../../../Metaplex';
declare const Key: "DirectBuyOperation";
/**
 * Creates a bid on a given asset and then executes a sale on the created bid and listing.
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .buy({ auctionHouse, listing, buyer };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const directBuyOperation: import("../../../types").OperationConstructor<DirectBuyOperation, "DirectBuyOperation", DirectBuyInput, DirectBuyOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type DirectBuyOperation = Operation<typeof Key, DirectBuyInput, DirectBuyOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type DirectBuyInput = {
    /** The Auction House in which to create a Bid and execute a Sale. */
    auctionHouse: AuctionHouse;
    /**
     * The Auction House authority.
     * If this is Signer the transaction fee
     * will be paid from the Auction House Fee Account
     *
     * @defaultValue `auctionHouse.authority`
     */
    authority?: PublicKey | Signer;
    /**
     * Creator of a bid.
     * Should not be the same as seller who creates a Listing
     *
     * @defaultValue `metaplex.identity()`
     */
    buyer?: Signer;
    /**
     * The Listing that is used in the sale.
     * We only need a subset of the `Listing` model but we
     * need enough information regarding its settings to know how
     * to execute the sale.
     *
     * This includes, its asset, auction house address, seller, receipt address etc.
     */
    listing: Pick<Listing, 'asset' | 'auctionHouse' | 'canceledAt' | 'price' | 'sellerAddress' | 'tokens' | 'tradeStateAddress' | 'receiptAddress'>;
    /**
     * The buyer's price.
     *
     * @defaultValue `listing.price`.
     */
    price?: SolAmount | SplTokenAmount;
    /**
     * The Auctioneer authority key.
     * It is required when Auction House has Auctioneer enabled.
     *
     * @defaultValue No default value.
     */
    auctioneerAuthority?: Signer;
    /**
     * The address of the bookkeeper wallet responsible for the receipt.
     *
     * @defaultValue `metaplex.identity()`
     */
    bookkeeper?: Signer;
    /**
     * Prints the purchase receipt.
     * The receipt holds information about the purchase,
     * So it's important to print it if you want to use the `Purchase` model
     *
     * @defaultValue `true`
     */
    printReceipt?: boolean;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type DirectBuyOutput = {
    /** A model that keeps information about the Bid. */
    bid: Bid;
    /** A model that keeps information about the Purchase. */
    purchase: Purchase;
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const directBuyOperationHandler: OperationHandler<DirectBuyOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type DirectBuyBuilderParams = Omit<DirectBuyInput, 'confirmOptions'> & {
    createBidInstructionKey?: string;
    executeSaleInstructionKey?: string;
};
/**
 * @group Transaction Builders
 * @category Contexts
 */
export declare type DirectBuyBuilderContext = Omit<DirectBuyOutput, 'response'>;
/**
 * Creates a bid on a given asset and executes a sale on the created bid and given listing.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .auctionHouse()
 *   .builders()
 *   .buy({ auctionHouse, listing, buyer })
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const directBuyBuilder: (metaplex: Metaplex, params: DirectBuyBuilderParams, options?: TransactionBuilderOptions) => Promise<TransactionBuilder<DirectBuyBuilderContext>>;
export {};
