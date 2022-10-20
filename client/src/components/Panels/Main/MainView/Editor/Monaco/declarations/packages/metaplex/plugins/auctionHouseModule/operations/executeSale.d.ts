import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { AuctionHouse, Bid, Listing, Purchase } from '../models';
import { Option, TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
import { Operation, OperationHandler, Pda, Signer, SolAmount, SplTokenAmount } from '../../../types';
import type { Metaplex } from '../../../Metaplex';
declare const Key: "ExecuteSaleOperation";
/**
 * Executes a sale on a given bid and listing.
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .executeSale({ auctionHouse, bid, listing };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const executeSaleOperation: import("../../../types").OperationConstructor<ExecuteSaleOperation, "ExecuteSaleOperation", ExecuteSaleInput, ExecuteSaleOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type ExecuteSaleOperation = Operation<typeof Key, ExecuteSaleInput, ExecuteSaleOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type ExecuteSaleInput = {
    /**
     * The Bid that is used in the sale.
     * We only need a subset of the `Bid` model but we
     * need enough information regarding its settings to know how
     * to execute the sale.
     *
     * This includes, its asset, auction house address, buyer, receipt address etc.
     */
    bid: Pick<Bid, 'asset' | 'auctionHouse' | 'buyerAddress' | 'canceledAt' | 'price' | 'receiptAddress' | 'tokens' | 'tradeStateAddress'>;
    /**
     * The Listing that is used in the sale.
     * We only need a subset of the `Listing` model but we
     * need enough information regarding its settings to know how
     * to execute the sale.
     *
     * This includes, its asset, auction house address, seller, receipt address etc.
     */
    listing: Pick<Listing, 'asset' | 'auctionHouse' | 'canceledAt' | 'price' | 'receiptAddress' | 'sellerAddress' | 'tokens' | 'tradeStateAddress'>;
    /** The Auction House in which to execute a sale. */
    auctionHouse: AuctionHouse;
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
export declare type ExecuteSaleOutput = {
    /** Seller trade state account address encoding the listing order. */
    sellerTradeState: PublicKey;
    /** Biyer trade state account address encoding the bid order. */
    buyerTradeState: PublicKey;
    /** The buyer address. */
    buyer: PublicKey;
    /** The seller address. */
    seller: PublicKey;
    /** The asset's metadata address. */
    metadata: PublicKey;
    /** The address of the bookkeeper account responsible for the receipt. */
    bookkeeper: Option<PublicKey>;
    /** The PDA of the receipt account in case it was printed. */
    receipt: Option<Pda>;
    /** The sale price. */
    price: SolAmount | SplTokenAmount;
    /** The number of tokens bought. */
    tokens: SplTokenAmount;
    /** A model that keeps information about the Purchase. */
    purchase: Purchase;
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * Executes a sale on a given bid and listing.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .auctionHouse()
 *   .builders()
 *   .executeSale({ auctionHouse, listing, bid });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const executeSaleOperationHandler: OperationHandler<ExecuteSaleOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type ExecuteSaleBuilderParams = Omit<ExecuteSaleInput, 'confirmOptions'> & {
    instructionKey?: string;
};
/**
 * @group Transaction Builders
 * @category Contexts
 */
export declare type ExecuteSaleBuilderContext = Omit<ExecuteSaleOutput, 'response' | 'purchase'>;
/**
 * @group Transaction Builders
 * @category Constructors
 */
export declare const executeSaleBuilder: (metaplex: Metaplex, params: ExecuteSaleBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder<ExecuteSaleBuilderContext>;
export {};
