import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Metaplex } from '../../../Metaplex';
import { Operation, OperationHandler, Signer } from '../../../types';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
declare const Key: "UnverifyNftCollectionOperation";
/**
 * Unverifies the collection of an NFT or SFT.
 *
 * ```ts
 * await metaplex
 *   .nfts()
 *   .unverifyCollection({ mintAddress, collectionMintAddress };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const unverifyNftCollectionOperation: import("../../../types").OperationConstructor<UnverifyNftCollectionOperation, "UnverifyNftCollectionOperation", UnverifyNftCollectionInput, UnverifyNftCollectionOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type UnverifyNftCollectionOperation = Operation<typeof Key, UnverifyNftCollectionInput, UnverifyNftCollectionOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type UnverifyNftCollectionInput = {
    /** The address of the mint account. */
    mintAddress: PublicKey;
    /** The mint address of the collection NFT. */
    collectionMintAddress: PublicKey;
    /**
     * An authority that can verify and unverify collection items
     * from the provided `collectionMintAddress`.
     *
     * @defaultValue `metaplex.identity()`
     */
    collectionAuthority?: Signer;
    /**
     * Whether or not the provided `collectionMintAddress` is a
     * sized collection (as opposed to a legacy collection).
     *
     * @defaultValue `true`
     */
    isSizedCollection?: boolean;
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
export declare type UnverifyNftCollectionOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const unverifyNftCollectionOperationHandler: OperationHandler<UnverifyNftCollectionOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type UnverifyNftCollectionBuilderParams = Omit<UnverifyNftCollectionInput, 'confirmOptions'> & {
    /** A key to distinguish the instruction that unverifies the collection. */
    instructionKey?: string;
};
/**
 * Unverifies the collection of an NFT or SFT.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .unverifyCollection({ mintAddress, collectionMintAddress });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const unverifyNftCollectionBuilder: (metaplex: Metaplex, params: UnverifyNftCollectionBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
