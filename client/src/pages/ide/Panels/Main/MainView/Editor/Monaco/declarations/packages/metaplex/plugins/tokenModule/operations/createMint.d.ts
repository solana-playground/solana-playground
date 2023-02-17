import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Mint } from '../models/Mint';
import { Option, TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
import { Operation, OperationHandler, Signer } from '../../../types';
import type { Metaplex } from '../../../Metaplex';
declare const Key: "CreateMintOperation";
/**
 * Creates a new mint account.
 *
 * ```ts
 * const { mint } = await metaplex.tokens().createMint();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const createMintOperation: import("../../../types").OperationConstructor<CreateMintOperation, "CreateMintOperation", CreateMintInput, CreateMintOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type CreateMintOperation = Operation<typeof Key, CreateMintInput, CreateMintOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type CreateMintInput = {
    /**
     * The number of decimal points used to define token amounts.
     *
     * @defaultValue `0`
     */
    decimals?: number;
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
     * @defaultValue `metaplex.identity().publicKey`
     */
    mintAuthority?: PublicKey;
    /**
     * The address of the authority that is allowed
     * to freeze token accounts.
     *
     * @defaultValue Defaults to using the same value as the
     * `mintAuthority` parameter.
     */
    freezeAuthority?: Option<PublicKey>;
};
/**
 * Create a new Mint account from the provided input
 * and returns the newly created `Mint` model.
 *
 * @group Operations
 * @category Outputs
 */
export declare type CreateMintOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
    /** The mint account as a Signer. */
    mintSigner: Signer;
    /** The created mint account. */
    mint: Mint;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const createMintOperationHandler: OperationHandler<CreateMintOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type CreateMintBuilderParams = Omit<CreateMintInput, 'confirmOptions'> & {
    /** A key to distinguish the instruction that creates the account. */
    createAccountInstructionKey?: string;
    /** A key to distinguish the instruction that initializes the mint account. */
    initializeMintInstructionKey?: string;
};
/**
 * @group Transaction Builders
 * @category Contexts
 */
export declare type CreateMintBuilderContext = Omit<CreateMintOutput, 'response' | 'mint'>;
/**
 * Creates a new mint account.
 *
 * ```ts
 * const transactionBuilder = await metaplex.tokens().builders().createMint();
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const createMintBuilder: (metaplex: Metaplex, params: CreateMintBuilderParams, options?: TransactionBuilderOptions) => Promise<TransactionBuilder<CreateMintBuilderContext>>;
export {};
