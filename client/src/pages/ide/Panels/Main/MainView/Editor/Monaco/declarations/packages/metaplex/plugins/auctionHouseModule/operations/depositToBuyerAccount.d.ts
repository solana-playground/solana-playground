import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { AuctionHouse } from '../models';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
import { Operation, OperationHandler, Signer, SolAmount, SplTokenAmount } from '../../../types';
import type { Metaplex } from '../../../Metaplex';
declare const Key: "DepositToBuyerAccountOperation";
/**
 * Adds funds to the user's buyer escrow account for the given auction house.
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .depositToBuyerAccount({ auctionHouse, buyer, amount };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const depositToBuyerAccountOperation: import("../../../types").OperationConstructor<DepositToBuyerAccountOperation, "DepositToBuyerAccountOperation", DepositToBuyerAccountInput, DepositToBuyerAccountOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type DepositToBuyerAccountOperation = Operation<typeof Key, DepositToBuyerAccountInput, DepositToBuyerAccountOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type DepositToBuyerAccountInput = {
    /**
     * The Auction House in which escrow buyer deposits funds.
     * We only need a subset of the `AuctionHouse` model but we
     * need enough information regarding its settings to know how
     * to deposit funds.
     *
     * This includes, its address, authority address, treasury mint, etc.
     */
    auctionHouse: Pick<AuctionHouse, 'address' | 'authorityAddress' | 'hasAuctioneer' | 'isNative' | 'treasuryMint' | 'feeAccountAddress'>;
    /**
     * The buyer who deposits funds.
     * This expects a Signer.
     *
     * @defaultValue `metaplex.identity()`
     */
    buyer?: Signer;
    /**
     * The Auctioneer authority key.
     * It is required when Auction House has Auctioneer enabled.
     *
     * @defaultValue Defaults to not being used.
     */
    auctioneerAuthority?: Signer;
    /**
     * Amount of funds to deposit.
     * This can either be in SOL or in the SPL token used by the Auction House as a currency.
     */
    amount: SolAmount | SplTokenAmount;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type DepositToBuyerAccountOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const depositToBuyerAccountOperationHandler: OperationHandler<DepositToBuyerAccountOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type DepositToBuyerAccountBuilderParams = Omit<DepositToBuyerAccountInput, 'confirmOptions'> & {
    instructionKey?: string;
};
/**
 * @group Transaction Builders
 * @category Contexts
 */
export declare type DepositToBuyerAccountBuilderContext = Omit<DepositToBuyerAccountOutput, 'response'>;
/**
 * Adds funds to the user's buyer escrow account for the given auction house.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .auctionHouse()
 *   .builders()
 *   .depositToBuyerAccount({ auctionHouse, buyer, amount });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const depositToBuyerAccountBuilder: (metaplex: Metaplex, params: DepositToBuyerAccountBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder<DepositToBuyerAccountBuilderContext>;
export {};
