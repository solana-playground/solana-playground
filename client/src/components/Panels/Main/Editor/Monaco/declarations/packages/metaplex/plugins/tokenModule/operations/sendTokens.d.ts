import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import type { Metaplex } from '../../../Metaplex';
import { KeypairSigner, Operation, OperationHandler, Signer, SplTokenAmount } from '../../../types';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
declare const Key: "SendTokensOperation";
/**
 * Send tokens from one account to another.
 *
 * ```ts
 * await metaplex
 *   .tokens()
 *   .send({
 *     mintAddress,
 *     toOwner,
 *     amount: token(100),
 *   };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const sendTokensOperation: import("../../../types").OperationConstructor<SendTokensOperation, "SendTokensOperation", SendTokensInput, SendTokensOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type SendTokensOperation = Operation<typeof Key, SendTokensInput, SendTokensOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type SendTokensInput = {
    /** The address of the mint account. */
    mintAddress: PublicKey;
    /** The amount of tokens to mint. */
    amount: SplTokenAmount;
    /**
     * The owner of the destination token account.
     *
     * @defaultValue `metaplex.identity().publicKey`
     */
    toOwner?: PublicKey;
    /**
     * The address of the destination token account.
     *
     * Note that this may be required as a `Signer` if the destination
     * token account does not exist and we need to create it before
     * sending the tokens.
     *
     * @defaultValue Defaults to using the associated token account
     * from the `mintAddress` and `toOwner` parameters.
     */
    toToken?: PublicKey | Signer;
    /**
     * The owner of the source token account.
     *
     * This may be provided as a PublicKey if one of the following is true:
     * - the owner of the source token account is a multisig and the
     *   `fromMultiSigners` parameter is provided.
     * - we are using a delegate authority to send the tokens and the
     *   `delegateAuthority` parameter is provided.
     *
     * @defaultValue `metaplex.identity()`
     */
    fromOwner?: PublicKey | Signer;
    /**
     * The address of the source token account.
     *
     * @defaultValue Defaults to using the associated token account
     * from the `mintAddress` and `fromOwner` parameters.
     */
    fromToken?: PublicKey;
    /**
     * The signing accounts to use if the source token owner is a multisig.
     *
     * @defaultValue `[]`
     */
    fromMultiSigners?: KeypairSigner[];
    /**
     * The delegate authority of the source token account as a Signer.
     *
     * This is required when the owner of the source token account
     * is provided as a PublicKey as someone needs to authorize
     * that transfer of tokens.
     *
     * @defaultValue Defaults to not using a delegate authority.
     */
    delegateAuthority?: Signer;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type SendTokensOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const sendTokensOperationHandler: OperationHandler<SendTokensOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type SendTokensBuilderParams = Omit<SendTokensInput, 'confirmOptions'> & {
    /**
     * Whether or not the receiving token account already exists.
     * If `false`, we'll add another instruction to create it.
     *
     * @defaultValue `true`
     */
    toTokenExists?: boolean;
    /** A key to distinguish the instruction that creates the associated token account. */
    createAssociatedTokenAccountInstructionKey?: string;
    /** A key to distinguish the instruction that creates the token account. */
    createAccountInstructionKey?: string;
    /** A key to distinguish the instruction that initializes the token account. */
    initializeTokenInstructionKey?: string;
    /** A key to distinguish the instruction that transfers the tokens. */
    transferTokensInstructionKey?: string;
};
/**
 * Send tokens from one account to another.
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .tokens()
 *   .builders()
 *   .send({
 *     mintAddress,
 *     toOwner,
 *     amount: token(100),
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const sendTokensBuilder: (metaplex: Metaplex, params: SendTokensBuilderParams, options?: TransactionBuilderOptions) => Promise<TransactionBuilder>;
export {};
