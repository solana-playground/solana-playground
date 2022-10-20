import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { AuctionHouse } from '../models';
import type { Metaplex } from '../../../Metaplex';
import { Operation, OperationHandler, Signer, SolAmount, SplTokenAmount } from '../../../types';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
declare const Key: "WithdrawFromFeeAccountOperation";
/**
 * Transfers funds from Auction House Fee Wallet to the Fee Withdrawal Destination Wallet.
 * By default Fee Withdrawal Destination Wallet is set to `metaplex.identity()`.
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .withdrawFromFeeAccount({ auctionHouse, amount };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const withdrawFromFeeAccountOperation: import("../../../types").OperationConstructor<WithdrawFromFeeAccountOperation, "WithdrawFromFeeAccountOperation", WithdrawFromFeeAccountInput, WithdrawFromFeeAccountOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type WithdrawFromFeeAccountOperation = Operation<typeof Key, WithdrawFromFeeAccountInput, WithdrawFromFeeAccountOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type WithdrawFromFeeAccountInput = {
    /**
     * The Auction House from which to transfer funds from the fee wallet to the fee withdrawal destination wallet.
     * `feeWithdrawalDestinationAddress` is set on Auction House creation, but you can also change it via the `update` operation.
     * */
    auctionHouse: Pick<AuctionHouse, 'address' | 'authorityAddress' | 'feeWithdrawalDestinationAddress' | 'feeAccountAddress'>;
    /**
     * The Auction House authority.
     *
     * @defaultValue `metaplex.identity()`
     */
    authority?: Signer;
    /**
     * Amount of funds to withdraw.
     * This can either be in SOL or in the SPL token used by the Auction House as a currency.
     */
    amount: SolAmount | SplTokenAmount;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type WithdrawFromFeeAccountOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const withdrawFromFeeAccountOperationHandler: OperationHandler<WithdrawFromFeeAccountOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type WithdrawFromFeeAccountBuilderParams = Omit<WithdrawFromFeeAccountInput, 'confirmOptions'> & {
    instructionKey?: string;
};
/**
 * @group Transaction Builders
 * @category Contexts
 */
export declare type WithdrawFromFeeAccountBuilderContext = Omit<WithdrawFromFeeAccountOutput, 'response'>;
/**
 * Transfers funds from Auction House Fee Wallet to the Fee Withdrawal Destination Wallet.
 * By default Fee Withdrawal Destination Wallet is set to `metaplex.identity()`.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .auctionHouse()
 *   .builders()
 *   .withdrawFromFeeAccount({ auctionHouse, amount });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const withdrawFromFeeAccountBuilder: (metaplex: Metaplex, params: WithdrawFromFeeAccountBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder<WithdrawFromFeeAccountBuilderContext>;
export {};
