import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Metaplex } from '../../../Metaplex';
import { KeypairSigner, Operation, OperationHandler, Signer, SplTokenAmount } from '../../../types';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
declare const Key: "ApproveTokenDelegateAuthorityOperation";
/**
 * Approves a delegate authority for a token account.
 *
 * ```ts
 * await metaplex
 *   .tokens()
 *   .approveDelegateAuthority({
 *     delegateAuthority,
 *     mintAddress,
 *   };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const approveTokenDelegateAuthorityOperation: import("../../../types").OperationConstructor<ApproveTokenDelegateAuthorityOperation, "ApproveTokenDelegateAuthorityOperation", ApproveTokenDelegateAuthorityInput, ApproveTokenDelegateAuthorityOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type ApproveTokenDelegateAuthorityOperation = Operation<typeof Key, ApproveTokenDelegateAuthorityInput, ApproveTokenDelegateAuthorityOutput>;
/**
 * @group Operations
 * @category Inputs
 * */
export declare type ApproveTokenDelegateAuthorityInput = {
    /** The address of the mint account. */
    mintAddress: PublicKey;
    /** The address of the new delegate authority. */
    delegateAuthority: PublicKey;
    /**
     * The maximum amount of tokens that can be manipulated
     * by the new delegate authority.
     *
     * @defaultValue `token(1)`
     */
    amount?: SplTokenAmount;
    /**
     * The owner of the token account as a Signer.
     *
     * This may be provided as a PublicKey if and only if
     * the `multiSigners` parameter is provided.
     *
     * @defaultValue `metaplex.identity()`
     */
    owner?: Signer | PublicKey;
    /**
     * The address of the token account.
     *
     * @defaultValue Defaults to using the associated token account
     * from the `mintAddress` and `owner` parameters.
     */
    tokenAddress?: PublicKey;
    /**
     * The signing accounts to use if the token owner is a multisig.
     *
     * @defaultValue `[]`
     */
    multiSigners?: KeypairSigner[];
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type ApproveTokenDelegateAuthorityOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const approveTokenDelegateAuthorityOperationHandler: OperationHandler<ApproveTokenDelegateAuthorityOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type ApproveTokenDelegateAuthorityBuilderParams = Omit<ApproveTokenDelegateAuthorityInput, 'confirmOptions'> & {
    /** A key to distinguish the instruction that approves the delegate authority. */
    instructionKey?: string;
};
/**
 * Approves a delegate authority for a token account.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .tokens()
 *   .builders()
 *   .approveDelegateAuthority({
 *     delegateAuthority,
 *     mintAddress,
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const approveTokenDelegateAuthorityBuilder: (metaplex: Metaplex, params: ApproveTokenDelegateAuthorityBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
