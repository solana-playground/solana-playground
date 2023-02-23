import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Metaplex } from '../../../Metaplex';
import { KeypairSigner, Operation, OperationHandler, Signer } from '../../../types';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
declare const Key: "RevokeTokenDelegateAuthorityOperation";
/**
 * Revokes the current delegate authority for a token account.
 *
 * ```ts
 * await metaplex
 *   .tokens()
 *   .revokeDelegateAuthority({ mintAddress };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const revokeTokenDelegateAuthorityOperation: import("../../../types").OperationConstructor<RevokeTokenDelegateAuthorityOperation, "RevokeTokenDelegateAuthorityOperation", RevokeTokenDelegateAuthorityInput, RevokeTokenDelegateAuthorityOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type RevokeTokenDelegateAuthorityOperation = Operation<typeof Key, RevokeTokenDelegateAuthorityInput, RevokeTokenDelegateAuthorityOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type RevokeTokenDelegateAuthorityInput = {
    mintAddress: PublicKey;
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
export declare type RevokeTokenDelegateAuthorityOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const revokeTokenDelegateAuthorityOperationHandler: OperationHandler<RevokeTokenDelegateAuthorityOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type RevokeTokenDelegateAuthorityBuilderParams = Omit<RevokeTokenDelegateAuthorityInput, 'confirmOptions'> & {
    /** A key to distinguish the instruction that revokes the delegated authority. */
    instructionKey?: string;
};
/**
 * Revokes the current delegate authority for a token account.
 *
 * ```ts
 * await metaplex
 *   .tokens()
 *   .builders()
 *   .revokeDelegateAuthority({ mintAddress });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const revokeTokenDelegateAuthorityBuilder: (metaplex: Metaplex, params: RevokeTokenDelegateAuthorityBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
