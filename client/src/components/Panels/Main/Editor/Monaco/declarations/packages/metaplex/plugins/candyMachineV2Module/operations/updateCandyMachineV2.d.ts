import { CandyMachineData } from '@metaplex-foundation/mpl-candy-machine';
import type { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { CandyMachineV2, CandyMachineV2Configs } from '../models';
import { Option, TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
import { Operation, OperationHandler, Signer } from '../../../types';
import { Metaplex } from '../../../Metaplex';
declare const Key: "UpdateCandyMachineV2Operation";
/**
 * Updates an existing Candy Machine.
 *
 * ```ts
 * await metaplex
 *   .candyMachinesV2()
 *   .update({
 *     candyMachine,
 *     price: sol(2), // Updates the price only.
 *   };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const updateCandyMachineV2Operation: import("../../../types").OperationConstructor<UpdateCandyMachineV2Operation, "UpdateCandyMachineV2Operation", UpdateCandyMachineV2Input, UpdateCandyMachineV2Output>;
/**
 * @group Operations
 * @category Types
 */
export declare type UpdateCandyMachineV2Operation = Operation<typeof Key, UpdateCandyMachineV2Input, UpdateCandyMachineV2Output>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type UpdateCandyMachineV2Input = Partial<CandyMachineV2Configs> & {
    /**
     * The Candy Machine to update.
     * We need the full model in order to compare the current data with
     * the provided data to update. For instance, if you only want to
     * update the `price`, we need to send an instruction that updates
     * the data whilst keeping all other properties the same.
     *
     * If you want more control over how this transaction is built,
     * you may use the associated transaction builder instead using
     * `metaplex.candyMachinesV2().builders().updateCandyMachineV2({...})`.
     */
    candyMachine: CandyMachineV2;
    /**
     * The Signer authorized to update the candy machine.
     *
     * @defaultValue `metaplex.identity()`
     */
    authority?: Signer;
    /**
     * The new Candy Machine authority.
     *
     * @defaultValue Defaults to not being updated.
     */
    newAuthority?: PublicKey;
    /**
     * The mint address of the new Candy Machine collection.
     * When `null` is provided, the collection is removed.
     *
     * @defaultValue Defaults to not being updated.
     */
    newCollection?: Option<PublicKey>;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type UpdateCandyMachineV2Output = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const updateCandyMachineV2OperationHandler: OperationHandler<UpdateCandyMachineV2Operation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type UpdateCandyMachineV2BuilderParams = {
    /**
     * The Candy Machine to update.
     * We only need a subset of the `CandyMachine` model to figure out
     * the current values for the wallet and collection addresses.
     */
    candyMachine: Pick<CandyMachineV2, 'address' | 'walletAddress' | 'collectionMintAddress'>;
    /**
     * The Signer authorized to update the candy machine.
     *
     * @defaultValue `metaplex.identity()`
     */
    authority?: Signer;
    /**
     * The new Candy Machine data.
     * This includes the wallet and token mint addresses
     * which can both be updated.
     *
     * @defaultValue Defaults to not being updated.
     */
    newData?: CandyMachineData & {
        wallet: PublicKey;
        tokenMint: Option<PublicKey>;
    };
    /**
     * The new Candy Machine authority.
     *
     * @defaultValue Defaults to not being updated.
     */
    newAuthority?: PublicKey;
    /**
     * The mint address of the new Candy Machine collection.
     * When `null` is provided, the collection is removed.
     *
     * @defaultValue Defaults to not being updated.
     */
    newCollection?: Option<PublicKey>;
    /** A key to distinguish the instruction that updates the data. */
    updateInstructionKey?: string;
    /** A key to distinguish the instruction that updates the authority. */
    updateAuthorityInstructionKey?: string;
    /** A key to distinguish the instruction that sets the collection. */
    setCollectionInstructionKey?: string;
    /** A key to distinguish the instruction that removes the collection. */
    removeCollectionInstructionKey?: string;
};
/**
 * Updates an existing Candy Machine.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .candyMachinesV2()
 *   .builders()
 *   .update({
 *     candyMachine: { address, walletAddress, collectionMintAddress },
 *     newData: {...}, // Updates the provided data.
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const updateCandyMachineV2Builder: (metaplex: Metaplex, params: UpdateCandyMachineV2BuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
