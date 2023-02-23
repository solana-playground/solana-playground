import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import type { Metaplex } from '../../../Metaplex';
import { KeypairSigner, Operation, OperationHandler, Signer, SplTokenAmount } from '../../../types';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
declare const Key: "MintTokensOperation";
/**
 * Mint tokens to an account.
 *
 * ```ts
 * await metaplex
 *   .tokens()
 *   .mint({
 *     mintAddress,
 *     toOwner,
 *     amount: token(100),
 *   };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const mintTokensOperation: import("../../../types").OperationConstructor<MintTokensOperation, "MintTokensOperation", MintTokensInput, MintTokensOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type MintTokensOperation = Operation<typeof Key, MintTokensInput, MintTokensOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type MintTokensInput = {
    /** The address of the mint account. */
    mintAddress: PublicKey;
    /** The amount of tokens to mint. */
    amount: SplTokenAmount;
    /**
     * The owner of the token account to mint to.
     *
     * @defaultValue `metaplex.identity().publicKey`
     */
    toOwner?: PublicKey;
    /**
     * The address of the token account to mint to.
     *
     * Note that this may be required as a `Signer` if the destination
     * token account does not exist and we need to create it before
     * minting the tokens.
     *
     * @defaultValue Defaults to using the associated token account
     * from the `mintAddress` and `toOwner` parameters.
     */
    toToken?: PublicKey | Signer;
    /**
     * The authority that is allowed to mint new tokens as a Signer.
     *
     * This may be provided as a PublicKey if and only if
     * the `multiSigners` parameter is provided.
     *
     * @defaultValue `metaplex.identity()`
     */
    mintAuthority?: PublicKey | Signer;
    /**
     * The signing accounts to use if the mint authority is a multisig.
     *
     * @defaultValue `[]`
     */
    multiSigners?: KeypairSigner[];
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type MintTokensOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const mintTokensOperationHandler: OperationHandler<MintTokensOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type MintTokensBuilderParams = Omit<MintTokensInput, 'confirmOptions'> & {
    /**
     * Whether or not the provided token account already exists.
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
    /** A key to distinguish the instruction that mints tokens. */
    mintTokensInstructionKey?: string;
};
/**
 * Mint tokens to an account.
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .tokens()
 *   .builders()
 *   .mint({
 *     mintAddress,
 *     toOwner,
 *     amount: token(100),
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const mintTokensBuilder: (metaplex: Metaplex, params: MintTokensBuilderParams, options?: TransactionBuilderOptions) => Promise<TransactionBuilder>;
export {};
