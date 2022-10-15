import { AuthorityScope } from '@metaplex-foundation/mpl-auction-house';
import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { AuctionHouse } from '../models/AuctionHouse';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
import { Operation, OperationHandler, Signer } from '../../../types';
import type { Metaplex } from '../../../Metaplex';
declare const Key: "UpdateAuctionHouseOperation";
/**
 * Updates an existing Auction House.
 *
 * ```ts
 * await metaplex
 *   .autionHouse()
 *   .update({
 *     auctionHouse,
 *     canChangeSalePrice: true, // Updates the canChangeSalePrice only.
 *   };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const updateAuctionHouseOperation: import("../../../types").OperationConstructor<UpdateAuctionHouseOperation, "UpdateAuctionHouseOperation", UpdateAuctionHouseInput, UpdateAuctionHouseOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type UpdateAuctionHouseOperation = Operation<typeof Key, UpdateAuctionHouseInput, UpdateAuctionHouseOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type UpdateAuctionHouseInput = {
    /**
     * The Auction House model.
     * We need the full model in order to compare the current data with
     * the provided data to update. For instance, if you only want to
     * update the `feeWithdrawalDestination`, we need to send an instruction that updates
     * the data whilst keeping all other properties the same.
     */
    auctionHouse: AuctionHouse;
    /**
     * The Auction House authority.
     *
     * @defaultValue `auctionHouse.authority`
     */
    authority?: Signer;
    /**
     * The share of the sale the auction house takes on all NFTs as a fee.
     *
     * @defaultValue `auctionHouse.requiresSignOff`
     */
    sellerFeeBasisPoints?: number | null;
    /**
     * This allows the centralised authority to gate which NFT can be listed, bought and sold.
     *
     * @defaultValue `auctionHouse.requiresSignOff`
     */
    requiresSignOff?: boolean | null;
    /**
     * Is intended to be used with the Auction House that requires sign off.
     * If the seller intentionally lists their NFT for a price of 0, a new FreeSellerTradeState is made.
     * The Auction House can then change the price to match a matching Bid that is greater than 0.
     *
     * @defaultValue `auctionHouse.canChangeSalePrice`
     */
    canChangeSalePrice?: boolean | null;
    /**
     * The new Auction House authority if you want to change it.
     *
     * @defaultValue `auctionHouse.authority`
     */
    newAuthority?: PublicKey;
    /**
     * The account that is marked as a destination of withdrawal from the fee account.
     *
     * @defaultValue `auctionHouse.feeWithdrawalDestination`
     */
    feeWithdrawalDestination?: PublicKey;
    /**
     * The account that is marked as the owner of treasury withdrawal destination.
     *
     * @defaultValue `auctionHouse.treasuryWithdrawalDestinationAddress`
     */
    treasuryWithdrawalDestinationOwner?: PublicKey;
    /**
     * The Auctioneer authority key.
     * It is required when Auction House is going to have Auctioneer enabled.
     *
     * Provide it if you want to delegate Auctioneer on the Auction House that doesn't have Auctioneer enabled.
     *
     * @defaultValue `auctionHouse.auctioneerAuthority`
     */
    auctioneerAuthority?: PublicKey;
    /**
     * The list of scopes available to the user in the Auctioneer.
     * For example Bid, List, Execute Sale.
     *
     * Only takes place when Auction House has Auctioneer enabled.
     *
     * @defaultValue `auctionHouse.auctioneerScopes`
     */
    auctioneerScopes?: AuthorityScope[];
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type UpdateAuctionHouseOutput = {
    /** The updated Auction House model. */
    auctionHouse: AuctionHouse;
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const updateAuctionHouseOperationHandler: OperationHandler<UpdateAuctionHouseOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type UpdateAuctionHouseBuilderParams = Omit<UpdateAuctionHouseInput, 'confirmOptions'> & {
    instructionKey?: string;
    delegateAuctioneerInstructionKey?: string;
    updateAuctioneerInstructionKey?: string;
};
/**
 * Updates an existing Auction House.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .auctionHouse()
 *   .builders()
 *   .updateAuctionHouse({ auctionHouse, canChangeSalePrice: true })
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const updateAuctionHouseBuilder: (metaplex: Metaplex, params: UpdateAuctionHouseBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
