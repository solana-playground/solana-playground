import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Metaplex } from '../../../Metaplex';
import { Operation, OperationHandler, Signer } from '../../../types';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
declare const Key: "ApproveNftCollectionAuthorityOperation";
/**
 * Approves a new collection authority.
 *
 * ```ts
 * await metaplex
 *   .nfts()
 *   .approveCollectionAuthority({
 *     mintAddress,
 *     collectionAuthority,
 *   };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const approveNftCollectionAuthorityOperation: import("../../../types").OperationConstructor<ApproveNftCollectionAuthorityOperation, "ApproveNftCollectionAuthorityOperation", ApproveNftCollectionAuthorityInput, ApproveNftCollectionAuthorityOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type ApproveNftCollectionAuthorityOperation = Operation<typeof Key, ApproveNftCollectionAuthorityInput, ApproveNftCollectionAuthorityOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type ApproveNftCollectionAuthorityInput = {
    /** The address of the mint account. */
    mintAddress: PublicKey;
    /** The address of the collection authority to approve. */
    collectionAuthority: PublicKey;
    /**
     * The update authority of the NFT or SFT as a Signer.
     *
     * @defaultValue `metaplex.identity()`
     */
    updateAuthority?: Signer;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type ApproveNftCollectionAuthorityOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const approveNftCollectionAuthorityOperationHandler: OperationHandler<ApproveNftCollectionAuthorityOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type ApproveNftCollectionAuthorityBuilderParams = Omit<ApproveNftCollectionAuthorityInput, 'confirmOptions'> & {
    /** A key to distinguish the instruction that approves the collection authority. */
    instructionKey?: string;
};
/**
 * Approves a new collection authority.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .approveCollectionAuthority({
 *     mintAddress,
 *     collectionAuthority,
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const approveNftCollectionAuthorityBuilder: (metaplex: Metaplex, params: ApproveNftCollectionAuthorityBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
