import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { TokenWithMint } from '../models/Token';
import { Option, TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
import { Operation, OperationHandler, Signer, SplTokenAmount } from '../../../types';
import type { Metaplex } from '../../../Metaplex';
declare const Key: "CreateTokenWithMintOperation";
/**
 * Creates both mint and token accounts in the same transaction.
 *
 * ```ts
 * const { token } = await metaplex.tokens().createTokenWithMint();
 * const mint = token.mint;
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const createTokenWithMintOperation: import("../../../types").OperationConstructor<CreateTokenWithMintOperation, "CreateTokenWithMintOperation", CreateTokenWithMintInput, CreateTokenWithMintOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type CreateTokenWithMintOperation = Operation<typeof Key, CreateTokenWithMintInput, CreateTokenWithMintOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type CreateTokenWithMintInput = {
    /**
     * The number of decimal points used to define token amounts.
     *
     * @defaultValue `0`
     */
    decimals?: number;
    /**
     * The initial amount of tokens to mint to the new token account.
     *
     * @defaultValue `0`
     */
    initialSupply?: SplTokenAmount;
    /**
     * The address of the new mint account as a Signer.
     *
     * @defaultValue `Keypair.generate()`
     */
    mint?: Signer;
    /**
     * The address of the authority that is allowed
     * to mint new tokens to token accounts.
     *
     * It may be required as a Signer in order to
     * mint the initial supply.
     *
     * @defaultValue `metaplex.identity()`
     */
    mintAuthority?: Signer | PublicKey;
    /**
     * The address of the authority that is allowed
     * to freeze token accounts.
     *
     * @defaultValue `metaplex.identity().publicKey`
     */
    freezeAuthority?: Option<PublicKey>;
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
export declare type CreateTokenWithMintOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
    /** The new mint account as a Signer. */
    mintSigner: Signer;
    /**
     * A model representing the newly created token
     * account and its associated mint account.
     */
    token: TokenWithMint;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const createTokenWithMintOperationHandler: OperationHandler<CreateTokenWithMintOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type CreateTokenWithMintBuilderParams = Omit<CreateTokenWithMintInput, 'confirmOptions'> & {
    /** A key to distinguish the instruction that creates the mint account. */
    createMintAccountInstructionKey?: string;
    /** A key to distinguish the instruction that initializes the mint account. */
    initializeMintInstructionKey?: string;
    /** A key to distinguish the instruction that creates the associates token account. */
    createAssociatedTokenAccountInstructionKey?: string;
    /** A key to distinguish the instruction that creates the token account. */
    createTokenAccountInstructionKey?: string;
    /** A key to distinguish the instruction that initializes the token account. */
    initializeTokenInstructionKey?: string;
    /** A key to distinguish the instruction that mints tokens to the token account. */
    mintTokensInstructionKey?: string;
};
/**
 * @group Transaction Builders
 * @category Contexts
 */
export declare type CreateTokenWithMintBuilderContext = {
    /** The mint account to create as a Signer. */
    mintSigner: Signer;
    /** The computed address of the token account to create. */
    tokenAddress: PublicKey;
};
/**
 * Creates both mint and token accounts in the same transaction.
 *
 * ```ts
 * const transactionBuilder = await metaplex.tokens().builders().createTokenWithMint();
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const createTokenWithMintBuilder: (metaplex: Metaplex, params: CreateTokenWithMintBuilderParams, options?: TransactionBuilderOptions) => Promise<TransactionBuilder<CreateTokenWithMintBuilderContext>>;
export {};
