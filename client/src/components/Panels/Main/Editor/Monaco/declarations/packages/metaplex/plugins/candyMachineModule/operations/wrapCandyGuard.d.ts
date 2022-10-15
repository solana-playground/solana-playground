import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Metaplex } from '../../../Metaplex';
import { Operation, OperationHandler, PublicKey, Signer } from '../../../types';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
declare const Key: "WrapCandyGuardOperation";
/**
 * Wraps the given Candy Machine in a Candy Guard.
 *
 * This makes the Candy Guard the mint authority for the Candy Machine
 * which means all minting will have to go through the Candy Guard.
 *
 * ```ts
 * await metaplex
 *   .candyMachines()
 *   .wrapCandyGuard({
 *     candyMachine,
 *     candyGuard,
 *   };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const wrapCandyGuardOperation: import("../../../types").OperationConstructor<WrapCandyGuardOperation, "WrapCandyGuardOperation", WrapCandyGuardInput, WrapCandyGuardOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type WrapCandyGuardOperation = Operation<typeof Key, WrapCandyGuardInput, WrapCandyGuardOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type WrapCandyGuardInput = {
    /** The address of the Candy Machine to wrap. */
    candyMachine: PublicKey;
    /** The address of the Candy Guard to wrap the Candy Machine with. */
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
export declare type WrapCandyGuardOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const wrapCandyGuardOperationHandler: OperationHandler<WrapCandyGuardOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type WrapCandyGuardBuilderParams = Omit<WrapCandyGuardInput, 'confirmOptions'> & {
    /** A key to distinguish the instruction that wraps the Candy Machine in a Candy Guard. */
    wrapCandyGuardInstructionKey?: string;
};
/**
 * Wraps the given Candy Machine in a Candy Guard.
 *
 * This makes the Candy Guard the mint authority for the Candy Machine
 * which means all minting will have to go through the Candy Guard.
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .candyMachines()
 *   .builders()
 *   .wrapCandyGuard({
 *     candyMachine,
 *     candyGuard,
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const wrapCandyGuardBuilder: (metaplex: Metaplex, params: WrapCandyGuardBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
