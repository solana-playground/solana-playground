import { CandyGuardsSettings, DefaultCandyGuardSettings } from '../guards';
import { CandyMachine } from '../models';
import { Operation, OperationHandler, PublicKey } from '../../../types';
declare const Key: "FindCandyMachineByAddressOperation";
/**
 * Find an existing Candy Machine by its address.
 *
 * ```ts
 * const candyMachine = await metaplex
 *   .candyMachines()
 *   .findbyAddress({ address };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const findCandyMachineByAddressOperation: typeof _findCandyMachineByAddressOperation;
declare function _findCandyMachineByAddressOperation<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(input: FindCandyMachineByAddressInput): FindCandyMachineByAddressOperation<T>;
declare namespace _findCandyMachineByAddressOperation {
    var key: "FindCandyMachineByAddressOperation";
}
/**
 * @group Operations
 * @category Types
 */
export declare type FindCandyMachineByAddressOperation<T extends CandyGuardsSettings = DefaultCandyGuardSettings> = Operation<typeof Key, FindCandyMachineByAddressInput, CandyMachine<T>>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FindCandyMachineByAddressInput = {
    /** The Candy Machine address. */
    address: PublicKey;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const findCandyMachineByAddressOperationHandler: OperationHandler<FindCandyMachineByAddressOperation>;
export {};
