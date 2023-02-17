import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { CandyMachine, CandyMachineItem } from '../models';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
import { Operation, OperationHandler, Signer } from '../../../types';
import { Metaplex } from '../../../Metaplex';
declare const Key: "InsertCandyMachineItemsOperation";
/**
 * Insert items into an existing Candy Machine.
 *
 * Note that the name and URI of each item should not include
 * the prefixes configured in the config line settings.
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
export declare const insertCandyMachineItemsOperation: import("../../../types").OperationConstructor<InsertCandyMachineItemsOperation, "InsertCandyMachineItemsOperation", InsertCandyMachineItemsInput, InsertCandyMachineItemsOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type InsertCandyMachineItemsOperation = Operation<typeof Key, InsertCandyMachineItemsInput, InsertCandyMachineItemsOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type InsertCandyMachineItemsInput = {
    /**
     * The Candy Machine to insert items into.
     *
     * We only need a subset of the `CandyMachine` model.
     * We need its address, its items settings and the number of items loaded
     * and to be loaded so we can check if the operation is valid.
     */
    candyMachine: Pick<CandyMachine, 'address' | 'itemsAvailable' | 'itemsLoaded' | 'itemSettings'>;
    /**
     * The Signer authorized to update the candy machine.
     *
     * @defaultValue `metaplex.identity()`
     */
    authority?: Signer;
    /**
     * The items to insert into the candy machine.
     *
     * This only requires the `name` and the `uri` to insert for each item.
     *
     * Important: If your config line settings use prefixes, you must
     * only provide the part of the name or URI that comes after theses prefixes.
     *
     * For example, if your config line settings use the following prefixes:
     * - `prefixName`: `My NFT #`
     * - `prefixUri`: `https://example.com/nfts/`
     *
     * Then, an item to insert could be: `{ name: '1', uri: '1.json' }`.
     *
     * @see {@link CandyMachineItem}
     */
    items: Pick<CandyMachineItem, 'name' | 'uri'>[];
    /**
     * The index we should use to insert the new items. This refers to the
     * index of the first item to insert and the others will follow after it.
     *
     * By defaults, this uses the `itemsLoaded` property so items are simply
     * appended to the current items.
     *
     * @defaultValue `candyMachine.itemsLoaded`
     */
    index?: number;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type InsertCandyMachineItemsOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const insertCandyMachineItemsOperationHandler: OperationHandler<InsertCandyMachineItemsOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type InsertCandyMachineItemsBuilderParams = Omit<InsertCandyMachineItemsInput, 'confirmOptions'> & {
    instructionKey?: string;
};
/**
 * Insert items into an existing Candy Machine.
 *
 * Note that the name and URI of each item should not include
 * the prefixes configured in the config line settings.
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
export declare const insertCandyMachineItemsBuilder: (metaplex: Metaplex, params: InsertCandyMachineItemsBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
