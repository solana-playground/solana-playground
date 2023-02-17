import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Token } from '../../tokenModule';
import { AuctionHouse, Listing, PrivateBid, PublicBid, Purchase } from '../models';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
import { Operation, OperationHandler, Signer } from '../../../types';
import type { Metaplex } from '../../../Metaplex';
declare const Key: "DirectSellOperation";
/**
 * Creates a listing on a given asset and then executes a sell on the created bid and listing.
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .sell({ auctionHouse, bid };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const directSellOperation: import("../../../types").OperationConstructor<DirectSellOperation, "DirectSellOperation", DirectSellInput, DirectSellOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type DirectSellOperation = Operation<typeof Key, DirectSellInput, DirectSellOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type DirectSellInput = {
    /** The Auction House in which to create a Listing and execute a Sale. */
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
     * Creator of a listing.
     *
     * There must be one and only one signer; Authority or Seller must sign.
     *
     * @defaultValue `metaplex.identity()`
     */
    seller?: PublicKey | Signer;
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
} & ({
    /**
     * The Token Account of an asset to sell.
     * Public Bid doesn't contain a token, so it must be provided externally via this parameter.
     */
    sellerToken: Token;
    /**
     * The Public Bid that is used in the sale.
     * We only need a subset of the `Bid` model but we
     * need enough information regarding its settings to know how
     * to execute the sale.
     *
     * This includes its auction house address, buyer, receipt address, etc.
     */
    bid: Omit<PublicBid, 'bookkeeperAddress' | 'purchaseReceiptAddress' | 'createdAt'>;
} | {
    /**
     * The Token Account of an asset to sell.
     * Not needed for private bid.
     */
    sellerToken?: null;
    /**
     * The Private Bid that is used in the sale.
     * We only need a subset of the `Bid` model but we
     * need enough information regarding its settings to know how
     * to execute the sale.
     *
     * This includes its asset, auction house address, buyer, receipt address, etc.
     */
    bid: Omit<PrivateBid, 'bookkeeperAddress' | 'purchaseReceiptAddress' | 'createdAt'>;
});
/**
 * @group Operations
 * @category Outputs
 */
export declare type DirectSellOutput = {
    /** A model that keeps information about the Listing. */
    listing: Listing;
    /** A model that keeps information about the Purchase. */
    purchase: Purchase;
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const directSellOperationHandler: OperationHandler<DirectSellOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type DirectSellBuilderParams = Omit<DirectSellInput, 'confirmOptions'> & {
    createListingInstructionKey?: string;
    executeSaleInstructionKey?: string;
};
/**
 * @group Transaction Builders
 * @category Contexts
 */
export declare type DirectSellBuilderContext = Omit<DirectSellOutput, 'response'>;
/**
 * Creates a listing on a given asset and executes a sale on the created listing and given bid.
 *
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .auctionHouse()
 *   .builders()
 *   .sell({ auctionHouse, bid, seller })
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const directSellBuilder: (metaplex: Metaplex, params: DirectSellBuilderParams, options?: TransactionBuilderOptions) => Promise<TransactionBuilder<DirectSellBuilderContext>>;
export {};
