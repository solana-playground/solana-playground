import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { CandyMachineV2 } from '../models/CandyMachineV2';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
import { Operation, OperationHandler, Signer } from '../../../types';
import { Metaplex } from '../../../Metaplex';
declare const Key: "DeleteCandyMachineV2Operation";
/**
 * Deletes an existing Candy Machine.
 *
 * ```ts
 * await metaplex.candyMachinesV2().delete({ candyMachine });
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const deleteCandyMachineV2Operation: import("../../../types").OperationConstructor<DeleteCandyMachineV2Operation, "DeleteCandyMachineV2Operation", DeleteCandyMachineV2Input, DeleteCandyMachineV2Output>;
/**
 * @group Operations
 * @category Types
 */
export declare type DeleteCandyMachineV2Operation = Operation<typeof Key, DeleteCandyMachineV2Input, DeleteCandyMachineV2Output>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type DeleteCandyMachineV2Input = {
    /**
     * The Candy Machine to delete.
     * We need the address of the Candy Machine as well as the address
     * of the potential collection since we will need to delete the PDA account
     * that links the Candy Machine to the collection.
     *
     * If the Candy Machine does not have a collection, simply set
     * `collectionMintAddress` to `null`.
     */
    candyMachine: Pick<CandyMachineV2, 'address' | 'collectionMintAddress'>;
    /**
     * The Signer authorized to update the candy machine.
     *
     * @defaultValue `metaplex.identity()`
     */
    authority?: Signer;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type DeleteCandyMachineV2Output = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const deleteCandyMachineV2OperationHandler: OperationHandler<DeleteCandyMachineV2Operation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type DeleteCandyMachineV2BuilderParams = Omit<DeleteCandyMachineV2Input, 'confirmOptions'> & {
    /** A key to distinguish the instruction that deletes the Candy Machine. */
    instructionKey?: string;
};
/**
 * Deletes an existing Candy Machine.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .candyMachinesV2()
 *   .builders()
 *   .delete({
 *     candyMachine: { address, collectionMintAddress },
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const deleteCandyMachineV2Builder: (metaplex: Metaplex, params: DeleteCandyMachineV2BuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
