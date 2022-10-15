import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Metaplex } from '../../../Metaplex';
import { Operation, OperationHandler, Signer } from '../../../types';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
declare const Key: "RevokeNftCollectionAuthorityOperation";
/**
 * Revokes an existing collection authority.
 *
 * ```ts
 * await metaplex
 *   .nfts()
 *   .revokeCollectionAuthority({ mintAddress, collectionAuthority };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const revokeNftCollectionAuthorityOperation: import("../../../types").OperationConstructor<RevokeNftCollectionAuthorityOperation, "RevokeNftCollectionAuthorityOperation", RevokeNftCollectionAuthorityInput, RevokeNftCollectionAuthorityOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type RevokeNftCollectionAuthorityOperation = Operation<typeof Key, RevokeNftCollectionAuthorityInput, RevokeNftCollectionAuthorityOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type RevokeNftCollectionAuthorityInput = {
    /** The address of the mint account. */
    mintAddress: PublicKey;
    /** The address of the collection authority to revoke. */
    collectionAuthority: PublicKey;
    /**
     * An authority that can revoke this collection authority.
     *
     * This can either be the collection's update authority or the delegated
     * collection authority itself (i.e. revoking its own rights).
     */
    revokeAuthority?: Signer;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type RevokeNftCollectionAuthorityOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const revokeNftCollectionAuthorityOperationHandler: OperationHandler<RevokeNftCollectionAuthorityOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type RevokeNftCollectionAuthorityBuilderParams = Omit<RevokeNftCollectionAuthorityInput, 'confirmOptions'> & {
    /** A key to distinguish the instruction that revokes the collection authority. */
    instructionKey?: string;
};
/**
 * Revokes an existing collection authority.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .revokeCollectionAuthority({ mintAddress, collectionAuthority });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const revokeNftCollectionAuthorityBuilder: (metaplex: Metaplex, params: RevokeNftCollectionAuthorityBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
