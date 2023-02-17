import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Metaplex } from '../../../Metaplex';
import { Operation, OperationHandler, Signer } from '../../../types';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
declare const Key: "UseNftOperation";
/**
 * Utilizes a usable NFT.
 *
 * ```ts
 * await metaplex.nfts().use({ mintAddress });
 * await metaplex.nfts().use({ mintAddress, numberOfUses: 3 });
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const useNftOperation: import("../../../types").OperationConstructor<UseNftOperation, "UseNftOperation", UseNftInput, UseNftOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type UseNftOperation = Operation<typeof Key, UseNftInput, UseNftOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type UseNftInput = {
    /** The address of the mint account. */
    mintAddress: PublicKey;
    /**
     * The number of uses to utilize.
     *
     * @defaultValue `1`
     */
    numberOfUses?: number;
    /**
     * The owner of the NFT or SFT.
     *
     * This must be a Signer unless a `useAuthority` is provided.
     *
     * @defaultValue `metaplex.identity()`
     */
    owner?: PublicKey | Signer;
    /**
     * The address of the token account linking the mint account
     * with the owner account.
     *
     * @defaultValue Defaults to using the associated token account
     * from the `mintAddress` and `owner` parameters.
     */
    ownerTokenAccount?: PublicKey;
    /**
     * The delegated use authority that should authorize this operation.
     *
     * @defaultValue Defaults to not using a delegated use authority
     * and using the `owner` parameter as a Signer instead.
     */
    useAuthority?: Signer;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type UseNftOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const useNftOperationHandler: OperationHandler<UseNftOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type UseNftBuilderParams = Omit<UseNftInput, 'confirmOptions'> & {
    /** A key to distinguish the instruction that uses the NFT. */
    instructionKey?: string;
};
/**
 * Utilizes a usable NFT.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .use({ mintAddress });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const useNftBuilder: (metaplex: Metaplex, params: UseNftBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
