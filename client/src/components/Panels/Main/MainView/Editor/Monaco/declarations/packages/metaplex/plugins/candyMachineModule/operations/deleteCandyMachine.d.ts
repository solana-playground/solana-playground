import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Metaplex } from '../../../Metaplex';
import { Operation, OperationHandler, PublicKey, Signer } from '../../../types';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
declare const Key: "DeleteCandyMachineOperation";
/**
 * Deletes a Candy Machine account by withdrawing its rent-exempt balance.
 *
 * ```ts
 * await metaplex
 *   .candyMachines()
 *   .delete({
 *     candyMachine: candyMachine.address,
 *     candyGuard: candyMachine.candyGuard.address,
 *     authority,
 *   };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const deleteCandyMachineOperation: import("../../../types").OperationConstructor<DeleteCandyMachineOperation, "DeleteCandyMachineOperation", DeleteCandyMachineInput, DeleteCandyMachineOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type DeleteCandyMachineOperation = Operation<typeof Key, DeleteCandyMachineInput, DeleteCandyMachineOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type DeleteCandyMachineInput = {
    /** The address of the Candy Machine account to delete. */
    candyMachine: PublicKey;
    /**
     * The address of the Candy Guard associated with the Candy Machine account.
     * When provided the Candy Guard will be deleted as well.
     *
     * @defaultValue Defaults to not being deleted.
     */
    candyGuard?: PublicKey;
    /**
     * The authority of the Candy Machine account.
     *
     * This is the account that will received the rent-exemption
     * lamports from the Candy Machine account.
     *
     * @defaultValue `metaplex.identity()`
     */
    authority?: Signer;
    /**
     * The authority of the Candy Guard account to delete.
     *
     * This is only required if `candyGuard` is provided and the Candy
     * Guard authority is not the same as the Candy Machine authority.
     *
     * @defaultValue `authority`
     */
    candyGuardAuthority?: Signer;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type DeleteCandyMachineOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const deleteCandyMachineOperationHandler: OperationHandler<DeleteCandyMachineOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type DeleteCandyMachineBuilderParams = Omit<DeleteCandyMachineInput, 'confirmOptions'> & {
    /** A key to distinguish the instruction that deletes the Candy Machine account. */
    deleteCandyMachineInstructionKey?: string;
};
/**
 * Deletes a Candy Machine account by withdrawing its rent-exempt balance.
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .candyMachines()
 *   .builders()
 *   .delete({
 *     candyMachine: candyMachine.address,
 *     candyGuard: candyMachine.candyGuard.address,
 *     authority,
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const deleteCandyMachineBuilder: (metaplex: Metaplex, params: DeleteCandyMachineBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
