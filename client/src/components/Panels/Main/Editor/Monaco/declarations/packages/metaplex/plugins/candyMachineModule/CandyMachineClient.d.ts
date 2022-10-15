import { CandyMachineBuildersClient } from './CandyMachineBuildersClient';
import { CandyMachineGuardsClient } from './CandyMachineGuardsClient';
import { CandyMachinePdasClient } from './CandyMachinePdasClient';
import { CandyGuardsMintSettings, CandyGuardsRouteSettings, CandyGuardsSettings, DefaultCandyGuardMintSettings, DefaultCandyGuardRouteSettings, DefaultCandyGuardSettings } from './guards';
import { CandyGuard, CandyMachine } from './models';
import { CallCandyGuardRouteInput, CreateCandyGuardInput, CreateCandyMachineInput, DeleteCandyGuardInput, DeleteCandyMachineInput, FindCandyGuardByAddressInput, FindCandyGuardsByAuthorityInput, FindCandyMachineByAddressInput, InsertCandyMachineItemsInput, MintFromCandyMachineInput, UnwrapCandyGuardInput, UpdateCandyGuardInput, UpdateCandyMachineInput, WrapCandyGuardInput } from './operations';
import { OperationOptions } from '../../types';
import type { Metaplex } from '../../Metaplex';
/**
 * This is a client for the Candy Machine V3 module.
 *
 * It enables us to interact with the Candy Machine V3 and Candy Guard programs
 * in order to create, update, delete and mint from Candy Machines as well as
 * registering your own custom Candy Guards.
 *
 * You may access this client via the `candyMachines()` method of your `Metaplex` instance.
 *
 * ```ts
 * const candyMachineClient = metaplex.candyMachines();
 * ```
 *
 * @example
 * You can create a new Candy Machine with minimum input like so.
 * By default, the current identity of the Metaplex instance will be
 * the authority of the Candy Machine and it will immediately create
 * a Candy Guard linked to the new Candy Machine.
 *
 * ```ts
 *  const { candyMachine } = await metaplex
 *    .candyMachines()
 *    .create({
 *      itemsAvailable: toBigNumber(5000),
 *      sellerFeeBasisPoints: 333, // 3.33%
 *      collection: {
 *        address: collectionNft.address,
 *        updateAuthority: collectionUpdateAuthority,
 *      },
 *    });
 * ```
 *
 * @see {@link CandyGuard} The `CandyGuard` model
 * @group Modules
 */
export declare class CandyMachineClient {
    readonly metaplex: Metaplex;
    protected readonly guardsClient: CandyMachineGuardsClient;
    constructor(metaplex: Metaplex);
    /**
     * You may use the `guards()` client to access the default guards
     * available as well as register your own guards.
     *
     * ```ts
     * const guardsClient = metaplex.candyMachines().guards();
     * ```
     */
    guards(): CandyMachineGuardsClient;
    /**
     * You may use the `builders()` client to access the
     * underlying Transaction Builders of this module.
     *
     * ```ts
     * const buildersClient = metaplex.candyMachines().builders();
     * ```
     */
    builders(): CandyMachineBuildersClient;
    /**
     * You may use the `pdas()` client to build PDAs related to this module.
     *
     * ```ts
     * const pdasClient = metaplex.candyMachines().pdas();
     * ```
     */
    pdas(): CandyMachinePdasClient;
    /** {@inheritDoc callCandyGuardRouteOperation} */
    callGuardRoute<Guard extends keyof RouteSettings & string, Settings extends CandyGuardsSettings = DefaultCandyGuardSettings, RouteSettings extends CandyGuardsRouteSettings = DefaultCandyGuardRouteSettings>(input: CallCandyGuardRouteInput<Guard, Settings extends undefined ? DefaultCandyGuardSettings : Settings, RouteSettings extends undefined ? DefaultCandyGuardRouteSettings : RouteSettings>, options?: OperationOptions): Promise<import("./operations").CallCandyGuardRouteOutput>;
    /** {@inheritDoc createCandyMachineOperation} */
    create<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(input: CreateCandyMachineInput<T extends undefined ? DefaultCandyGuardSettings : T>, options?: OperationOptions): Promise<import("./operations").CreateCandyMachineOutput<T extends undefined ? DefaultCandyGuardSettings : T>>;
    /** {@inheritDoc createCandyGuardOperation} */
    createCandyGuard<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(input: CreateCandyGuardInput<T extends undefined ? DefaultCandyGuardSettings : T>, options?: OperationOptions): Promise<import("./operations").CreateCandyGuardOutput<T extends undefined ? DefaultCandyGuardSettings : T>>;
    /** {@inheritDoc deleteCandyMachineOperation} */
    delete(input: DeleteCandyMachineInput, options?: OperationOptions): Promise<import("./operations").DeleteCandyMachineOutput>;
    /** {@inheritDoc deleteCandyGuardOperation} */
    deleteCandyGuard(input: DeleteCandyGuardInput, options?: OperationOptions): Promise<import("./operations").DeleteCandyGuardOutput>;
    /** {@inheritDoc findCandyGuardsByAuthorityOperation} */
    findAllCandyGuardsByAuthority<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(input: FindCandyGuardsByAuthorityInput, options?: OperationOptions): Promise<CandyGuard<T>[]>;
    /** {@inheritDoc findCandyMachineByAddressOperation} */
    findByAddress<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(input: FindCandyMachineByAddressInput, options?: OperationOptions): Promise<CandyMachine<T>>;
    /** {@inheritDoc findCandyGuardByAddressOperation} */
    findCandyGuardByAddress<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(input: FindCandyGuardByAddressInput, options?: OperationOptions): Promise<CandyGuard<T>>;
    /**
     * Helper method that fetches a Candy Guard via the base
     * address used to derived its PDA.
     *
     * ```ts
     * const candyGuard = await metaplex
     *   .candyMachines()
     *   .findCandyGuardByBaseAddress({ address: base });
     * ```
     */
    findCandyGuardByBaseAddress<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(input: FindCandyGuardByAddressInput, options?: OperationOptions): Promise<CandyGuard<T>>;
    /** {@inheritDoc insertCandyMachineItemsOperation} */
    insertItems(input: InsertCandyMachineItemsInput, options?: OperationOptions): Promise<import("./operations").InsertCandyMachineItemsOutput>;
    /** {@inheritDoc mintFromCandyMachineOperation} */
    mint<Settings extends CandyGuardsSettings = DefaultCandyGuardSettings, MintSettings extends CandyGuardsMintSettings = DefaultCandyGuardMintSettings>(input: MintFromCandyMachineInput<Settings extends undefined ? DefaultCandyGuardSettings : Settings, MintSettings extends undefined ? DefaultCandyGuardMintSettings : MintSettings>, options?: OperationOptions): Promise<import("./operations").MintFromCandyMachineOutput>;
    /**
     * Helper method that refetches a given Candy Machine or Candy Guard.
     *
     * ```ts
     * const candyMachine = await metaplex.candyMachines().refresh(candyMachine);
     * const candyGuard = await metaplex.candyMachines().refresh(candyGuard);
     * ```
     */
    refresh<T extends CandyGuardsSettings, M extends CandyMachine<T> | CandyGuard<T>>(model: M, options?: OperationOptions): Promise<M>;
    /** {@inheritDoc unwrapCandyGuardOperation} */
    unwrapCandyGuard(input: UnwrapCandyGuardInput, options?: OperationOptions): Promise<import("./operations").UnwrapCandyGuardOutput>;
    /** {@inheritDoc updateCandyMachineOperation} */
    update<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(input: UpdateCandyMachineInput<T extends undefined ? DefaultCandyGuardSettings : T>, options?: OperationOptions): Promise<import("./operations").UpdateCandyMachineOutput>;
    /** {@inheritDoc updateCandyGuardOperation} */
    updateCandyGuard<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(input: UpdateCandyGuardInput<T extends undefined ? DefaultCandyGuardSettings : T>, options?: OperationOptions): Promise<import("./operations").UpdateCandyGuardOutput>;
    /** {@inheritDoc wrapCandyGuardOperation} */
    wrapCandyGuard(input: WrapCandyGuardInput, options?: OperationOptions): Promise<import("./operations").WrapCandyGuardOutput>;
}
