import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Metaplex } from '../../../Metaplex';
import { Operation, OperationHandler, Signer } from '../../../types';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
declare const Key: "DeleteNftOperation";
/**
 * Deletes an existing NFT.
 *
 * ```ts
 * await metaplex
 *   .nfts()
 *   .delete({ mintAddress };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const deleteNftOperation: import("../../../types").OperationConstructor<DeleteNftOperation, "DeleteNftOperation", DeleteNftInput, DeleteNftOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type DeleteNftOperation = Operation<typeof Key, DeleteNftInput, DeleteNftOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type DeleteNftInput = {
    /** The address of the mint account. */
    mintAddress: PublicKey;
    /**
     * The owner of the NFT as a Signer.
     *
     * @defaultValue `metaplex.identity()`
     */
    owner?: Signer;
    /**
     * The explicit token account linking the provided mint and owner
     * accounts, if that account is not their associated token account.
     *
     * @defaultValue Defaults to using the associated token account
     * from the `mintAddress` and `owner` parameters.
     */
    ownerTokenAccount?: PublicKey;
    /**
     * The address of the Sized Collection NFT associated with the
     * NFT to delete, if any. This is required as the collection NFT
     * will need to decrement its size.
     *
     * @defaultValue Defaults to assuming the NFT is not associated with a
     * Size Collection NFT.
     */
    collection?: PublicKey;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type DeleteNftOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const deleteNftOperationHandler: OperationHandler<DeleteNftOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type DeleteNftBuilderParams = Omit<DeleteNftInput, 'confirmOptions'> & {
    /** A key to distinguish the instruction that burns the NFT. */
    instructionKey?: string;
};
/**
 * Deletes an existing NFT.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .delete({ mintAddress });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const deleteNftBuilder: (metaplex: Metaplex, params: DeleteNftBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
