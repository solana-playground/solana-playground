import { PublicKey } from '@solana/web3.js';
import { Operation, OperationHandler, SolAmount } from '../../../types';
declare const Key: "GetBuyerBalanceOperation";
/**
 * Gets the balance of a buyer's escrow account for a given Auction House.
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .getBuyerBalance({ auctionHouse, buyerAddress };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const getBuyerBalanceOperation: import("../../../types").OperationConstructor<GetBuyerBalanceOperation, "GetBuyerBalanceOperation", GetBuyerBalanceInput, SolAmount>;
/**
 * @group Operations
 * @category Types
 */
export declare type GetBuyerBalanceOperation = Operation<typeof Key, GetBuyerBalanceInput, GetBuyerBalanceOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type GetBuyerBalanceInput = {
    /** The Auction House in which to get the buyer's escrow balance. */
    auctionHouse: PublicKey;
    /** The buyer's address. */
    buyerAddress: PublicKey;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type GetBuyerBalanceOutput = SolAmount;
/**
 * @group Operations
 * @category Handlers
 */
export declare const getBuyerBalanceOperationHandler: OperationHandler<GetBuyerBalanceOperation>;
export {};
