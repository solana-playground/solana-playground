import { PublicKey } from '@solana/web3.js';
import { CandyGuardsSettings, DefaultCandyGuardSettings } from '../guards';
import { CandyGuard } from '../models';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "FindCandyGuardByAddressOperation";
/**
 * Find an existing Candy Guard by its address.
 *
 * ```ts
 * const candyGuard = await metaplex
 *   .candyMachines()
 *   .findCandyGuardbyAddress({ address };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const findCandyGuardByAddressOperation: typeof _findCandyGuardByAddressOperation;
declare function _findCandyGuardByAddressOperation<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(input: FindCandyGuardByAddressInput): FindCandyGuardByAddressOperation<T>;
declare namespace _findCandyGuardByAddressOperation {
    var key: "FindCandyGuardByAddressOperation";
}
/**
 * @group Operations
 * @category Types
 */
export declare type FindCandyGuardByAddressOperation<T extends CandyGuardsSettings = DefaultCandyGuardSettings> = Operation<typeof Key, FindCandyGuardByAddressInput, CandyGuard<T>>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FindCandyGuardByAddressInput = {
    /** The Candy Guard address. */
    address: PublicKey;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const findCandyGuardByAddressOperationHandler: OperationHandler<FindCandyGuardByAddressOperation>;
export {};
