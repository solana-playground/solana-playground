import { PublicKey } from '@solana/web3.js';
import { CandyMachineV2 } from '../models';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "FindCandyMachinesV2ByPublicKeyOperation";
/**
 * Find all Candy Machines matching by a given `publicKey` or a given `type`.
 *
 * The following two types are supported.
 *
 * `authority`: Find Candy Machines whose authority is the given `publicKey`.
 * ```ts
 * const someAuthority = new PublicKey('...');
 * const candyMachines = await metaplex
 *   .candyMachinesV2()
 *   .findAllBy({ type: 'authority', someAuthority });
 * ```
 *
 * `wallet`: Find Candy Machines whose wallet address is the given `publicKey`.
 * ```ts
 * const someWallet = new PublicKey('...');
 * const candyMachines = await metaplex
 *   .candyMachinesV2()
 *   .findAllBy({ type: 'wallet', someWallet });
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const findCandyMachinesV2ByPublicKeyFieldOperation: import("../../../types").OperationConstructor<FindCandyMachinesV2ByPublicKeyFieldOperation, "FindCandyMachinesV2ByPublicKeyOperation", FindCandyMachinesV2ByPublicKeyFieldInput, CandyMachineV2[]>;
/**
 * @group Operations
 * @category Types
 */
export declare type FindCandyMachinesV2ByPublicKeyFieldOperation = Operation<typeof Key, FindCandyMachinesV2ByPublicKeyFieldInput, CandyMachineV2[]>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type FindCandyMachinesV2ByPublicKeyFieldInput = {
    /** Defines which type of account the `publicKey` field refers to.  */
    type: 'authority' | 'wallet';
    /** The publicKey to filter Candy Machine by. */
    publicKey: PublicKey;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const findCandyMachinesV2ByPublicKeyFieldOperationHandler: OperationHandler<FindCandyMachinesV2ByPublicKeyFieldOperation>;
export {};
