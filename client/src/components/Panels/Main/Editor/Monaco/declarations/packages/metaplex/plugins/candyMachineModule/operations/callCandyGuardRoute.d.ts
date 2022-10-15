import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { CandyGuardsRouteSettings, CandyGuardsSettings, DefaultCandyGuardRouteSettings, DefaultCandyGuardSettings } from '../guards';
import { CandyMachine } from '../models';
import { Option, TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
import { Operation, OperationHandler } from '../../../types';
import { Metaplex } from '../../../Metaplex';
declare const Key: "CallCandyGuardRouteOperation";
/**
 * Calls the special "route" instruction on a specific guard.
 *
 * This allows guards to provide additional features such as creating
 * PDAs that verify a payer before the mint instruction is executed or
 * freezing and thawing minted NFTs.
 *
 * The "route" instruction must select a specific guard on a specific group
 * (if groups are enabled) since it is possible for the same type of guard
 * to have different settings based on its group.
 *
 * Additionally, it is possible for a guard to support multiple "paths" within
 * their "route" instruction. The route settings of the guard will usually use
 * the `path` property to distinguish them.
 *
 * ```ts
 * const { nft } = await metaplex
 *   .candyMachines()
 *   .callGuardRoute({
 *     candyMachine,
 *     guard: 'allowList',
 *     settings: {
 *       path: 'proof',
 *       merkleProof: getMerkleProof(data, leaf)
 *     },
 *   };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const callCandyGuardRouteOperation: typeof _callCandyGuardRouteOperation;
declare function _callCandyGuardRouteOperation<Guard extends keyof RouteSettings & string, Settings extends CandyGuardsSettings = DefaultCandyGuardSettings, RouteSettings extends CandyGuardsRouteSettings = DefaultCandyGuardRouteSettings>(input: CallCandyGuardRouteInput<Guard, Settings, RouteSettings>): CallCandyGuardRouteOperation<Guard, Settings, RouteSettings>;
declare namespace _callCandyGuardRouteOperation {
    var key: "CallCandyGuardRouteOperation";
}
/**
 * @group Operations
 * @category Types
 */
export declare type CallCandyGuardRouteOperation<Guard extends keyof RouteSettings & string, Settings extends CandyGuardsSettings = DefaultCandyGuardSettings, RouteSettings extends CandyGuardsRouteSettings = DefaultCandyGuardRouteSettings> = Operation<typeof Key, CallCandyGuardRouteInput<Guard, Settings, RouteSettings>, CallCandyGuardRouteOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type CallCandyGuardRouteInput<Guard extends keyof RouteSettings & string, Settings extends CandyGuardsSettings = DefaultCandyGuardSettings, RouteSettings extends CandyGuardsRouteSettings = DefaultCandyGuardRouteSettings> = {
    /**
     * The Candy Machine containing the guard we are interested in.
     * We only need a subset of the `CandyMachine` model but we
     * need enough information regarding its settings to know how
     * to execute the route instruction on the guard.
     *
     * This includes its address and the Candy Guard account associated with it.
     */
    candyMachine: Pick<CandyMachine<Settings>, 'address' | 'candyGuard'>;
    /**
     * The guard to select on the Candy Machine.
     *
     * If the Candy Machine uses groups of guards, the `group` property
     * must also be provided so we known which specific guard to select.
     */
    guard: Guard;
    /**
     * The route settings of the selected guard.
     *
     * These will depend on the type of guard selected but they will
     * usually include a `path` property to distinguish between the
     * different paths available within their "route" instruction.
     */
    settings: RouteSettings[Guard];
    /**
     * The label of the group to mint from.
     *
     * If groups are configured on the Candy Machine,
     * you must specify a group label to mint from.
     *
     * When set to `null` it will mint using the default
     * guards, provided no groups are configured.
     *
     * @defaultValue `null`
     */
    group?: Option<string>;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type CallCandyGuardRouteOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const callCandyGuardRouteOperationHandler: OperationHandler<CallCandyGuardRouteOperation<any>>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type CallCandyGuardRouteBuilderParams<Guard extends keyof RouteSettings & string, Settings extends CandyGuardsSettings = DefaultCandyGuardSettings, RouteSettings extends CandyGuardsRouteSettings = DefaultCandyGuardRouteSettings> = Omit<CallCandyGuardRouteInput<Guard, Settings, RouteSettings>, 'confirmOptions'> & {
    /** A key to distinguish the instruction that mints from the Candy Machine. */
    instructionKey?: string;
};
/**
 * Calls the special "route" instruction on a specific guard.
 *
 * This allows guards to provide additional features such as creating
 * PDAs that verify a payer before the mint instruction is executed or
 * freezing and thawing minted NFTs.
 *
 * The "route" instruction must select a specific guard on a specific group
 * (if groups are enabled) since it is possible for the same type of guard
 * to have different settings based on its group.
 *
 * Additionally, it is possible for a guard to support multiple "paths" within
 * their "route" instruction. The route settings of the guard will usually use
 * the `path` property to distinguish them.
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .candyMachines()
 *   .builders()
 *   .callGuardRoute({
 *     candyMachine,
 *     guard: 'allowList',
 *     settings: {
 *       path: 'proof',
 *       merkleProof: getMerkleProof(data, leaf)
 *     },
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const callCandyGuardRouteBuilder: <Guard extends keyof RouteSettings & string, Settings extends CandyGuardsSettings = DefaultCandyGuardSettings, RouteSettings extends CandyGuardsRouteSettings = DefaultCandyGuardRouteSettings>(metaplex: Metaplex, params: CallCandyGuardRouteBuilderParams<Guard, Settings, RouteSettings>, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
