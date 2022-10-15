import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Metaplex } from '../../../Metaplex';
import { Operation, OperationHandler, Signer } from '../../../types';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
declare const Key: "UnverifyNftCreatorOperation";
/**
 * Unverifies the creator of an NFT or SFT.
 *
 * ```ts
 * await metaplex
 *   .nfts()
 *   .unverifyCreator({ mintAddress, creator };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const unverifyNftCreatorOperation: import("../../../types").OperationConstructor<UnverifyNftCreatorOperation, "UnverifyNftCreatorOperation", UnverifyNftCreatorInput, UnverifyNftCreatorOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type UnverifyNftCreatorOperation = Operation<typeof Key, UnverifyNftCreatorInput, UnverifyNftCreatorOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type UnverifyNftCreatorInput = {
    /** The address of the mint account. */
    mintAddress: PublicKey;
    /**
     * The creator of the NFT or SFT as a Signer.
     *
     * @defaultValue `metaplex.identity()`
     */
    creator?: Signer;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type UnverifyNftCreatorOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const unverifyNftCreatorOperationHandler: OperationHandler<UnverifyNftCreatorOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type UnverifyNftCreatorBuilderParams = Omit<UnverifyNftCreatorInput, 'confirmOptions'> & {
    /** A key to distinguish the instruction that unverifies the creator. */
    instructionKey?: string;
};
/**
 * Unverifies the creator of an NFT or SFT.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .unverifyCreator({ mintAddress, creator });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const unverifyNftCreatorBuilder: (metaplex: Metaplex, params: UnverifyNftCreatorBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
