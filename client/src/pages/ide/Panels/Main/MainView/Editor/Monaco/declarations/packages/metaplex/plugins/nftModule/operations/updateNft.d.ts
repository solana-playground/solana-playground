import { Uses } from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Sft } from '../models';
import { Option, TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
import { CreatorInput, Operation, OperationHandler, Signer } from '../../../types';
import { Metaplex } from '../../../Metaplex';
declare const Key: "UpdateNftOperation";
/**
 * Updates an existing NFT or SFT.
 *
 * ```ts
 * await metaplex
 *   .nfts()
 *   .update({ nftOrSft, name: "My new NFT name" };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const updateNftOperation: import("../../../types").OperationConstructor<UpdateNftOperation, "UpdateNftOperation", UpdateNftInput, UpdateNftOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type UpdateNftOperation = Operation<typeof Key, UpdateNftInput, UpdateNftOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type UpdateNftInput = {
    /**
     * The NFT or SFT to update.
     * We only need a subset of the `Sft` (or `Nft`) model to figure out
     * the current values for the data of the metadata account and only update
     * the parts that are different.
     */
    nftOrSft: Pick<Sft, 'address' | 'collection' | 'creators' | 'name' | 'symbol' | 'uri' | 'sellerFeeBasisPoints' | 'uses'>;
    /**
     * The current update authority of the asset as a Signer.
     *
     * @defaultValue `metaplex.identity()`
     */
    updateAuthority?: Signer;
    /**
     * The address of the new update authority to set for the asset
     *
     * @defaultValue Defaults to not being updated.
     */
    newUpdateAuthority?: PublicKey;
    /**
     * The new on-chain name of the asset.
     *
     * @defaultValue Defaults to not being updated.
     */
    name?: string;
    /**
     * The new on-chain symbol of the asset.
     *
     * @defaultValue Defaults to not being updated.
     */
    symbol?: string;
    /**
     * The new on-chain uri of the asset.
     *
     * @defaultValue Defaults to not being updated.
     */
    uri?: string;
    /**
     * The new royalties of the asset in percent basis point
     * (i.e. 250 is 2.5%) that should be paid to the creators
     * on each secondary sale.
     *
     * @defaultValue Defaults to not being updated.
     */
    sellerFeeBasisPoints?: number;
    /**
     * The new creators for the asset.
     * For each creator, if an `authority` Signer is provided,
     * the creator will be marked as verified.
     *
     * @defaultValue Defaults to not being updated.
     */
    creators?: CreatorInput[];
    /**
     * Whether or not the asset has already been sold to its first buyer.
     * This can only be flipped from `false` to `true`.
     *
     * @defaultValue Defaults to not being updated.
     */
    primarySaleHappened?: boolean;
    /**
     * Whether or not the asset is mutable.
     * When set to `false` no one can update the Metadata account,
     * not even the update authority.
     * This can only be flipped from `true` to `false`.
     *
     * @defaultValue Defaults to not being updated.
     */
    isMutable?: boolean;
    /**
     * When this field is not `null`, it indicates that the asset
     * can be "used" by its owner or any approved "use authorities".
     *
     * @defaultValue Defaults to not being updated.
     */
    uses?: Option<Uses>;
    /**
     * The new Collection NFT that this asset belongs to.
     * When `null`, this will remove the asset from its current collection.
     *
     * @defaultValue Defaults to not being updated.
     */
    collection?: Option<PublicKey>;
    /**
     * The collection authority that should sign the asset
     * to prove that it is part of the newly provided collection.
     * When `null`, the provided `collection` will not be verified.
     *
     * @defaultValue `null`
     */
    collectionAuthority?: Option<Signer>;
    /**
     * Whether or not the provided `collectionAuthority` is a delegated
     * collection authority, i.e. it was approved by the update authority
     * using `metaplex.nfts().approveCollectionAuthority()`.
     *
     * @defaultValue `false`
     */
    collectionAuthorityIsDelegated?: boolean;
    /**
     * Whether or not the newly provided `collection` is a sized collection
     * and not a legacy collection.
     *
     * @defaultValue `true`
     */
    collectionIsSized?: boolean;
    /**
     * Whether or not the current asset's collection is a sized collection
     * and not a legacy collection.
     *
     * @defaultValue `true`
     */
    oldCollectionIsSized?: boolean;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type UpdateNftOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const updateNftOperationHandler: OperationHandler<UpdateNftOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type UpdateNftBuilderParams = Omit<UpdateNftInput, 'confirmOptions'> & {
    /** A key to distinguish the instruction that updates the metadata account. */
    updateMetadataInstructionKey?: string;
};
/**
 * Updates an existing NFT or SFT.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .update({ nftOrSft, name: "My new NFT name" });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const updateNftBuilder: (metaplex: Metaplex, params: UpdateNftBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
