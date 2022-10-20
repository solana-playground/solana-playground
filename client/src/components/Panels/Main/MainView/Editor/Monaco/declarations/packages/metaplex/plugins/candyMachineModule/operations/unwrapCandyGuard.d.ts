import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Metaplex } from '../../../Metaplex';
import { Operation, OperationHandler, PublicKey, Signer } from '../../../types';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
declare const Key: "UnwrapCandyGuardOperation";
/**
 * Unwraps the given Candy Machine from its Candy Guard.
 *
 * This makes the Candy Machine authority its own mint authority again
 *
 * ```ts
 * await metaplex
 *   .candyMachines()
 *   .unwrapCandyGuard({
 *     candyMachine,
 *     candyGuard,
 *   };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const unwrapCandyGuardOperation: import("../../../types").OperationConstructor<UnwrapCandyGuardOperation, "UnwrapCandyGuardOperation", UnwrapCandyGuardInput, UnwrapCandyGuardOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type UnwrapCandyGuardOperation = Operation<typeof Key, UnwrapCandyGuardInput, UnwrapCandyGuardOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type UnwrapCandyGuardInput = {
    /** The address of the Candy Machine to unwrap. */
    candyMachine: PublicKey;
    /** The address of the Candy Guard to unwrap the Candy Machine from. */
    candyGuard: PublicKey;
    /**
     * The authority of the Candy Machine as a Signer.
     *
     * @defaultValue `metaplex.identity()`
     */
    candyMachineAuthority?: Signer;
    /**
     * The authority of the Candy Guard as a Signer.
     *
     * @defaultValue `metaplex.identity()`
     */
    candyGuardAuthority?: Signer;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type UnwrapCandyGuardOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const unwrapCandyGuardOperationHandler: OperationHandler<UnwrapCandyGuardOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type UnwrapCandyGuardBuilderParams = Omit<UnwrapCandyGuardInput, 'confirmOptions'> & {
    /** A key to distinguish the instruction that unwraps the Candy Machine from its Candy Guard. */
    unwrapCandyGuardInstructionKey?: string;
};
/**
 * Unwraps the given Candy Machine from its Candy Guard.
 *
 * This makes the Candy Machine authority its own mint authority again
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .candyMachines()
 *   .builders()
 *   .unwrapCandyGuard({
 *     candyMachine,
 *     candyGuard,
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const unwrapCandyGuardBuilder: (metaplex: Metaplex, params: UnwrapCandyGuardBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
