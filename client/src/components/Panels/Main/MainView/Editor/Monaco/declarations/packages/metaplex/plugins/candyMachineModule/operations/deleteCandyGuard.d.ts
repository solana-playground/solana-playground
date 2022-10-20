import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Metaplex } from '../../../Metaplex';
import { Operation, OperationHandler, PublicKey, Signer } from '../../../types';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
declare const Key: "DeleteCandyGuardOperation";
/**
 * Deletes a Candy Guard account by withdrawing its rent-exempt balance.
 *
 * ```ts
 * await metaplex
 *   .candyMachines()
 *   .deleteCandyGuard({
 *     candyGuard,
 *     authority,
 *   };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const deleteCandyGuardOperation: import("../../../types").OperationConstructor<DeleteCandyGuardOperation, "DeleteCandyGuardOperation", DeleteCandyGuardInput, DeleteCandyGuardOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type DeleteCandyGuardOperation = Operation<typeof Key, DeleteCandyGuardInput, DeleteCandyGuardOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type DeleteCandyGuardInput = {
    /** The address of the Candy Guard account to delete. */
    candyGuard: PublicKey;
    /**
     * The authority of the Candy Guard account.
     *
     * This is the account that will received the rent-exemption
     * lamports from the Candy Guard account.
     *
     * @defaultValue `metaplex.identity()`
     */
    authority?: Signer;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type DeleteCandyGuardOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const deleteCandyGuardOperationHandler: OperationHandler<DeleteCandyGuardOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type DeleteCandyGuardBuilderParams = Omit<DeleteCandyGuardInput, 'confirmOptions'> & {
    /** A key to distinguish the instruction that deletes the Candy Guard account. */
    deleteCandyGuardInstructionKey?: string;
};
/**
 * Deletes a Candy Guard account by withdrawing its rent-exempt balance.
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .candyMachines()
 *   .builders()
 *   .deleteCandyGuard({
 *     candyGuard,
 *     authority,
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const deleteCandyGuardBuilder: (metaplex: Metaplex, params: DeleteCandyGuardBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
