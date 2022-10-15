import { PublicKey } from '@solana/web3.js';
import { CandyGuardsSettings, DefaultCandyGuardSettings } from '../guards';
import { CandyGuard } from '../models';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "FindCandyGuardsByAuthorityOperation";
/**
 * Find all Candy Guards matching by a given authority.
 *
 * ```ts
 * const candyGuards = await metaplex
 *   .candyMachines()
 *   .findAllCandyGuardsByAuthority({ authority: new PublicKey('...') });
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const findCandyGuardsByAuthorityOperation: typeof _findCandyGuardsByAuthorityOperation;
declare function _findCandyGuardsByAuthorityOperation<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(input: FindCandyGuardsByAuthorityInput): FindCandyGuardsByAuthorityOperation<T>;
declare namespace _findCandyGuardsByAuthorityOperation {
    var key: "FindCandyGuardsByAuthorityOperation";
}
/**
 * @group Operations
 * @category Types
 */
export declare type FindCandyGuardsByAuthorityOperation<T extends CandyGuardsSettings = DefaultCandyGuardSettings> = Operation<typeof Key, FindCandyGuardsByAuthorityInput, CandyGuard<T>[]>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FindCandyGuardsByAuthorityInput = {
    /** The authority to filter Candy Guards by. */
    authority: PublicKey;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const findCandyGuardsByAuthorityOperationHandler: OperationHandler<FindCandyGuardsByAuthorityOperation>;
export {};
