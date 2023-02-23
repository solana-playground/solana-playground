import { PublicKey } from '@solana/web3.js';
import { CandyMachineV2 } from '../models';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "FindCandyMachineV2ByAddressOperation";
/**
 * Find an existing Candy Machine by its address.
 *
 * ```ts
 * const candyMachine = await metaplex.candyMachinesV2().findbyAddress({ address });
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const findCandyMachineV2ByAddressOperation: import("../../../types").OperationConstructor<FindCandyMachineV2ByAddressOperation, "FindCandyMachineV2ByAddressOperation", FindCandyMachineV2ByAddressInput, CandyMachineV2>;
/**
 * @group Operations
 * @category Types
 */
export declare type FindCandyMachineV2ByAddressOperation = Operation<typeof Key, FindCandyMachineV2ByAddressInput, CandyMachineV2>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FindCandyMachineV2ByAddressInput = {
    /** The Candy Machine address. */
    address: PublicKey;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const findCandyMachineV2ByAddressOperationHandler: OperationHandler<FindCandyMachineV2ByAddressOperation>;
export {};
