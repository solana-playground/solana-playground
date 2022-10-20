import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Metaplex } from '../../../Metaplex';
import { BigNumber, Operation, OperationHandler, Signer } from '../../../types';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
declare const Key: "MigrateToSizedCollectionNftOperation";
/**
 * Migrates a legacy Collection NFT to a sized Collection NFT.
 * Both can act as a Collection for NFTs but only the latter
 * keeps track of the size of the collection on chain.
 *
 * ```ts
 * await metaplex
 *   .nfts()
 *   .migrateToSizedCollection({ mintAddress, size: toBigNumber(10000) };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const migrateToSizedCollectionNftOperation: import("../../../types").OperationConstructor<MigrateToSizedCollectionNftOperation, "MigrateToSizedCollectionNftOperation", MigrateToSizedCollectionNftInput, MigrateToSizedCollectionNftOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type MigrateToSizedCollectionNftOperation = Operation<typeof Key, MigrateToSizedCollectionNftInput, MigrateToSizedCollectionNftOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type MigrateToSizedCollectionNftInput = {
    /** The address of the mint account. */
    mintAddress: PublicKey;
    /**
     * An authority that can update the Collection NFT at the
     * given mint address. This can either be the update authority
     * for that Collection NFT or an approved delegate authority.
     *
     * @defaultValue `metaplex.identity()`
     */
    collectionAuthority?: Signer;
    /**
     * The current size of all **verified** NFTs and/or SFTs within
     * the Collection.
     *
     * **Warning, once set, this size can no longer be updated.**
     */
    size: BigNumber;
    /**
     * Whether or not the provided `collectionAuthority` is a delegated
     * collection authority, i.e. it was approved by the update authority
     * using `metaplex.nfts().approveCollectionAuthority()`.
     *
     * @defaultValue `false`
     */
    isDelegated?: boolean;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type MigrateToSizedCollectionNftOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const migrateToSizedCollectionNftOperationHandler: OperationHandler<MigrateToSizedCollectionNftOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type MigrateToSizedCollectionNftBuilderParams = Omit<MigrateToSizedCollectionNftInput, 'confirmOptions'> & {
    /** A key to distinguish the instruction that sets the collection size. */
    instructionKey?: string;
};
/**
 * Migrates a legacy Collection NFT to a sized Collection NFT.
 * Both can act as a Collection for NFTs but only the latter
 * keeps track of the size of the collection on chain.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .migrateToSizedCollection({ mintAddress, size: toBigNumber(10000) });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const migrateToSizedCollectionNftBuilder: (metaplex: Metaplex, params: MigrateToSizedCollectionNftBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
