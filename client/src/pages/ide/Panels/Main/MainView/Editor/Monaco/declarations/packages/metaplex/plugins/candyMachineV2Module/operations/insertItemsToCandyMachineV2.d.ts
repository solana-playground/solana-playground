import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { CandyMachineV2, CandyMachineV2Item } from '../models';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
import { BigNumber, Operation, OperationHandler, Signer } from '../../../types';
import { Metaplex } from '../../../Metaplex';
declare const Key: "InsertItemsToCandyMachineV2Operation";
/**
 * Insert items into an existing Candy Machine.
 *
 * ```ts
 * await metaplex
 *   .candyMachines()
 *   .insertItems({
 *     candyMachine,
 *     items: [
 *       { name: 'My NFT #1', uri: 'https://example.com/nft1' },
 *       { name: 'My NFT #2', uri: 'https://example.com/nft2' },
 *       { name: 'My NFT #3', uri: 'https://example.com/nft3' },
 *     ],
 *   };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const insertItemsToCandyMachineV2Operation: import("../../../types").OperationConstructor<InsertItemsToCandyMachineV2Operation, "InsertItemsToCandyMachineV2Operation", InsertItemsToCandyMachineV2Input, InsertItemsToCandyMachineV2Output>;
/**
 * @group Operations
 * @category Types
 */
export declare type InsertItemsToCandyMachineV2Operation = Operation<typeof Key, InsertItemsToCandyMachineV2Input, InsertItemsToCandyMachineV2Output>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type InsertItemsToCandyMachineV2Input = {
    /**
     * The Candy Machine to insert items into.
     *
     * We only need a subset of the `CandyMachine` model.
     * We need its address and the number of items loaded and to be loaded
     * so we can check if the operation is valid.
     */
    candyMachine: Pick<CandyMachineV2, 'itemsAvailable' | 'itemsLoaded' | 'address'>;
    /**
     * The Signer authorized to update the candy machine.
     *
     * @defaultValue `metaplex.identity()`
     */
    authority?: Signer;
    /**
     * The items to insert into the candy machine.
     */
    items: CandyMachineV2Item[];
    /**
     * The index we should use to insert the new items. This refers to the
     * index of the first item to insert and the others will follow after it.
     *
     * By defaults, this uses the `itemsLoaded` property so items are simply
     * appended to the current items.
     *
     * @defaultValue `candyMachine.itemsLoaded`
     */
    index?: BigNumber;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type InsertItemsToCandyMachineV2Output = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const InsertItemsToCandyMachineV2OperationHandler: OperationHandler<InsertItemsToCandyMachineV2Operation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type InsertItemsToCandyMachineV2BuilderParams = Omit<InsertItemsToCandyMachineV2Input, 'confirmOptions'> & {
    instructionKey?: string;
};
/**
 * Insert items into an existing Candy Machine.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .candyMachines()
 *   .builders()
 *   .insertItems({ candyMachine, items });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const insertItemsToCandyMachineV2Builder: (metaplex: Metaplex, params: InsertItemsToCandyMachineV2BuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
