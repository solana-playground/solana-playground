import { CandyGuardsMintSettings, CandyGuardsRouteSettings, CandyGuardsSettings, DefaultCandyGuardMintSettings, DefaultCandyGuardRouteSettings, DefaultCandyGuardSettings } from './guards';
import { CallCandyGuardRouteBuilderParams, CreateCandyGuardBuilderParams, CreateCandyMachineBuilderParams, DeleteCandyGuardBuilderParams, DeleteCandyMachineBuilderParams, InsertCandyMachineItemsBuilderParams, MintFromCandyMachineBuilderParams, UnwrapCandyGuardBuilderParams, UpdateCandyGuardBuilderParams, UpdateCandyMachineBuilderParams, WrapCandyGuardBuilderParams } from './operations';
import type { Metaplex } from '../../Metaplex';
import { TransactionBuilderOptions } from '../../utils';
/**
 * This client allows you to access the underlying Transaction Builders
 * for the write operations of the Candy Guard module.
 *
 * @see {@link CandyMachineClient}
 * @group Module Builders
 */
export declare class CandyMachineBuildersClient {
    protected readonly metaplex: Metaplex;
    constructor(metaplex: Metaplex);
    /** {@inheritDoc callCandyGuardRouteBuilder} */
    callGuardRoute<Guard extends keyof RouteSettings & string, Settings extends CandyGuardsSettings = DefaultCandyGuardSettings, RouteSettings extends CandyGuardsRouteSettings = DefaultCandyGuardRouteSettings>(input: CallCandyGuardRouteBuilderParams<Guard, Settings, RouteSettings>, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc createCandyMachineBuilder} */
    create<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(input: CreateCandyMachineBuilderParams<T>, options?: TransactionBuilderOptions): Promise<import("../../utils").TransactionBuilder<import("./operations").CreateCandyMachineBuilderContext>>;
    /** {@inheritDoc createCandyGuardBuilder} */
    createCandyGuard<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(input: CreateCandyGuardBuilderParams<T>, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<import("./operations").CreateCandyGuardBuilderContext>;
    /** {@inheritDoc deleteCandyMachineBuilder} */
    delete(input: DeleteCandyMachineBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc deleteCandyGuardBuilder} */
    deleteCandyGuard(input: DeleteCandyGuardBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc insertCandyMachineItemsBuilder} */
    insertItems(input: InsertCandyMachineItemsBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc mintFromCandyMachineBuilder} */
    mint<Settings extends CandyGuardsSettings = DefaultCandyGuardSettings, MintSettings extends CandyGuardsMintSettings = DefaultCandyGuardMintSettings>(input: MintFromCandyMachineBuilderParams<Settings, MintSettings>, options?: TransactionBuilderOptions): Promise<import("../../utils").TransactionBuilder<import("./operations").MintFromCandyMachineBuilderContext>>;
    /** {@inheritDoc unwrapCandyGuardBuilder} */
    unwrapCandyGuard(input: UnwrapCandyGuardBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc updateCandyMachineBuilder} */
    update<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(input: UpdateCandyMachineBuilderParams<T>, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc updateCandyGuardBuilder} */
    updateCandyGuard<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(input: UpdateCandyGuardBuilderParams<T>, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc wrapCandyGuardBuilder} */
    wrapCandyGuard(input: WrapCandyGuardBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
}
