import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Token } from '../models/Token';
import type { Metaplex } from '../../../Metaplex';
import { Operation, OperationHandler, Signer } from '../../../types';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
declare const Key: "CreateTokenOperation";
/**
 * Creates a new token account.
 *
 * ```ts
 * const { token } = await metaplex.tokens().createToken({ mint });
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const createTokenOperation: import("../../../types").OperationConstructor<CreateTokenOperation, "CreateTokenOperation", CreateTokenInput, CreateTokenOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type CreateTokenOperation = Operation<typeof Key, CreateTokenInput, CreateTokenOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type CreateTokenInput = {
    /**
     * The address of the mint account associated
     * with the new token account.
     */
    mint: PublicKey;
    /**
     * The address of the owner of the new token account.
     *
     * @defaultValue `metaplex.identity().publicKey`
     */
    owner?: PublicKey;
    /**
     * The token account as a Signer if we want to create
     * a new token account with a specific address instead of
     * creating a new associated token account.
     *
     * @defaultValue Defaults to creating a new associated token account
     * using the `mint` and `owner` parameters.
     */
    token?: Signer;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type CreateTokenOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
    /** The newly created token account. */
    token: Token;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const createTokenOperationHandler: OperationHandler<CreateTokenOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type CreateTokenBuilderParams = Omit<CreateTokenInput, 'confirmOptions'> & {
    /** A key to distinguish the instruction that creates the associated token account. */
    createAssociatedTokenAccountInstructionKey?: string;
    /** A key to distinguish the instruction that creates the account. */
    createAccountInstructionKey?: string;
    /** A key to distinguish the instruction that initializes the token account. */
    initializeTokenInstructionKey?: string;
};
/**
 * @group Transaction Builders
 * @category Contexts
 */
export declare type CreateTokenBuilderContext = {
    /** The computed address of the token account to create. */
    tokenAddress: PublicKey;
};
/**
 * Creates a new token account.
 *
 * ```ts
 * const transactionBuilder = await metaplex.tokens().builders().createToken({ mint });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const createTokenBuilder: (metaplex: Metaplex, params: CreateTokenBuilderParams, options?: TransactionBuilderOptions) => Promise<TransactionBuilder<CreateTokenBuilderContext>>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type CreateTokenIfMissingBuilderParams = Omit<CreateTokenBuilderParams, 'token'> & {
    /**
     * The token account to create if it does not exist.
     * Here, it may be passed as a PublicKey if and only
     * if it already exists.
     */
    token?: PublicKey | Signer;
    /**
     * Whether or not the token account exists.
     *
     * @defaultValue `true`
     */
    tokenExists?: boolean;
    /**
     * The name of the token variable on the operation that uses
     * this helper token builder.
     *
     * @defaultValue `"token"`
     */
    tokenVariable?: string;
};
export {};
