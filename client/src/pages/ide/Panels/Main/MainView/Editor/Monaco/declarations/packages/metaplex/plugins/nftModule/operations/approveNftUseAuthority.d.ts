import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Metaplex } from '../../../Metaplex';
import { Operation, OperationHandler, Signer } from '../../../types';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
declare const Key: "ApproveNftUseAuthorityOperation";
/**
 * Approves a new use authority.
 *
 * ```ts
 * await metaplex
 *   .nfts()
 *   .approveUseAuthority({ mintAddress, user };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const approveNftUseAuthorityOperation: import("../../../types").OperationConstructor<ApproveNftUseAuthorityOperation, "ApproveNftUseAuthorityOperation", ApproveNftUseAuthorityInput, ApproveNftUseAuthorityOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type ApproveNftUseAuthorityOperation = Operation<typeof Key, ApproveNftUseAuthorityInput, ApproveNftUseAuthorityOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type ApproveNftUseAuthorityInput = {
    /** The address of the mint account. */
    mintAddress: PublicKey;
    /** The address of the use authority to approve. */
    user: PublicKey;
    /**
     * The owner of the NFT or SFT as a Signer.
     *
     * @defaultValue `metaplex.identity()`
     */
    owner?: Signer;
    /**
     * The address of the token account linking the mint account
     * with the owner account.
     *
     * @defaultValue Defaults to using the associated token account
     * from the `mintAddress` and `owner` parameters.
     */
    ownerTokenAddress?: PublicKey;
    /**
     * The number of usages this new use authority
     * is allowed to perform.
     *
     * @defaultValue `1`
     */
    numberOfUses?: number;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type ApproveNftUseAuthorityOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const approveNftUseAuthorityOperationHandler: OperationHandler<ApproveNftUseAuthorityOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type ApproveNftUseAuthorityBuilderParams = Omit<ApproveNftUseAuthorityInput, 'confirmOptions'> & {
    /** A key to distinguish the instruction that approves the use authority. */
    instructionKey?: string;
};
/**
 * Approves a new use authority.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .approveUseAuthority({ mintAddress, user });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const approveNftUseAuthorityBuilder: (metaplex: Metaplex, params: ApproveNftUseAuthorityBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
