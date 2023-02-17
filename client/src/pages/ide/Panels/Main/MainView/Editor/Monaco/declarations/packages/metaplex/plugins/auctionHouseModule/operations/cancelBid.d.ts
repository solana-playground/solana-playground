import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { AuctionHouse, Bid } from '../models';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
import { Operation, OperationHandler, Signer } from '../../../types';
import type { Metaplex } from '../../../Metaplex';
declare const Key: "CancelBidOperation";
/**
 * Cancels the user's bid in the given auction house.
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .cancelBid({ auctionHouse, bid };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const cancelBidOperation: import("../../../types").OperationConstructor<CancelBidOperation, "CancelBidOperation", CancelBidInput, CancelBidOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type CancelBidOperation = Operation<typeof Key, CancelBidInput, CancelBidOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type CancelBidInput = {
    /**
     * The Auction House in which to cancel Bid.
     * We only need a subset of the `AuctionHouse` model but we
     * need enough information regarding its settings to know how
     * to cancel bid.
     *
     * This includes, its address, authority address, its fee account address, etc.
     */
    auctionHouse: Pick<AuctionHouse, 'authorityAddress' | 'address' | 'feeAccountAddress' | 'hasAuctioneer'>;
    /**
     * The Bid to cancel.
     * We only need a subset of the `Bid` model but we
     * need enough information regarding its settings to know how
     * to cancel it.
     *
     * This includes, its asset, buyer address, price, receipt address etc.
     */
    bid: Pick<Bid, 'asset' | 'buyerAddress' | 'isPublic' | 'price' | 'receiptAddress' | 'tokens' | 'tradeStateAddress'>;
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
export declare type CancelBidOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const cancelBidOperationHandler: OperationHandler<CancelBidOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type CancelBidBuilderParams = Omit<CancelBidInput, 'confirmOptions'> & {
    instructionKey?: string;
};
/**
 * @group Transaction Builders
 * @category Contexts
 */
export declare type CancelBidBuilderContext = Omit<CancelBidOutput, 'response'>;
/**
 * Cancels the user's bid in the given auction house.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .auctionHouse()
 *   .builders()
 *   .cancelBid({ auctionHouse, bid });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const cancelBidBuilder: (metaplex: Metaplex, params: CancelBidBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder<CancelBidBuilderContext>;
export {};
