import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { AuctionHouse, Listing } from '../models';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
import { Operation, OperationHandler, Signer } from '../../../types';
import type { Metaplex } from '../../../Metaplex';
declare const Key: "CancelListingOperation";
/**
 * Cancels the user's listing in the given auction house.
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .cancelListing({ auctionHouse, listing };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const cancelListingOperation: import("../../../types").OperationConstructor<CancelListingOperation, "CancelListingOperation", CancelListingInput, CancelListingOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type CancelListingOperation = Operation<typeof Key, CancelListingInput, CancelListingOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type CancelListingInput = {
    /** The Auction House in which to cancel Bid. */
    auctionHouse: Pick<AuctionHouse, 'address' | 'authorityAddress' | 'feeAccountAddress' | 'hasAuctioneer'>;
    /**
     * The Listing to cancel.
     * We only need a subset of the `Listing` model but we
     * need enough information regarding its settings to know how
     * to cancel it.
     *
     * This includes, its asset, seller address, price, receipt address etc.
     */
    listing: Pick<Listing, 'asset' | 'price' | 'receiptAddress' | 'sellerAddress' | 'tokens' | 'tradeStateAddress'>;
    /**
     * The Auctioneer authority key.
     * It is required when Auction House has Auctioneer enabled.
     *
     * @defaultValue No default value.
     */
    auctioneerAuthority?: Signer;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type CancelListingOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const cancelListingOperationHandler: OperationHandler<CancelListingOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type CancelListingBuilderParams = Omit<CancelListingInput, 'confirmOptions'> & {
    instructionKey?: string;
};
/**
 * @group Transaction Builders
 * @category Contexts
 */
export declare type CancelListingBuilderContext = Omit<CancelListingOutput, 'response'>;
/**
 * Cancels the user's listing in the given auction house.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .auctionHouse()
 *   .builders()
 *   .cancelListing({ auctionHouse, listing });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const cancelListingBuilder: (metaplex: Metaplex, params: CancelListingBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder<CancelListingBuilderContext>;
export {};
