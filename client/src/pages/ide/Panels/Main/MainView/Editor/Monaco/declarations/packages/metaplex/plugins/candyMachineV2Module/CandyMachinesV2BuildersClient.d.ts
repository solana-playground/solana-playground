import { CreateCandyMachineV2BuilderParams, DeleteCandyMachineV2BuilderParams, InsertItemsToCandyMachineV2BuilderParams, MintCandyMachineV2BuilderParams, UpdateCandyMachineV2BuilderParams } from './operations';
import type { Metaplex } from '../../Metaplex';
import { TransactionBuilderOptions } from '../../utils';
/**
 * This client allows you to access the underlying Transaction Builders
 * for the write operations of the Candy Machine module.
 *
 * @see {@link CandyMachinesV2Client}
 * @group Module Builders
 */
export declare class CandyMachinesV2BuildersClient {
    protected readonly metaplex: Metaplex;
    constructor(metaplex: Metaplex);
    /** {@inheritDoc createCandyMachineV2Builder} */
    create(input: CreateCandyMachineV2BuilderParams, options?: TransactionBuilderOptions): Promise<import("../../utils").TransactionBuilder<import("./operations").CreateCandyMachineV2BuilderContext>>;
    /** {@inheritDoc deleteCandyMachineV2Builder} */
    delete(input: DeleteCandyMachineV2BuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc insertItemsToCandyMachineV2Builder} */
    insertItems(input: InsertItemsToCandyMachineV2BuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc mintCandyMachineV2Builder} */
    mint(input: MintCandyMachineV2BuilderParams, options?: TransactionBuilderOptions): Promise<import("../../utils").TransactionBuilder<import("./operations").MintCandyMachineV2BuilderContext>>;
    /** {@inheritDoc updateCandyMachineV2Builder} */
    update(input: UpdateCandyMachineV2BuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
}
