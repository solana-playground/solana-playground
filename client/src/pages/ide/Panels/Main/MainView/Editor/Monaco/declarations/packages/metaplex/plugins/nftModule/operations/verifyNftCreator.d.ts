import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Metaplex } from '../../../Metaplex';
import { Operation, OperationHandler, Signer } from '../../../types';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
declare const Key: "VerifyNftCreatorOperation";
/**
 * Verifies the creator of an NFT or SFT.
 *
 * ```ts
 * await metaplex
 *   .nfts()
 *   .verifyCreator({ mintAddress, creator };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const verifyNftCreatorOperation: import("../../../types").OperationConstructor<VerifyNftCreatorOperation, "VerifyNftCreatorOperation", VerifyNftCreatorInput, VerifyNftCreatorOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type VerifyNftCreatorOperation = Operation<typeof Key, VerifyNftCreatorInput, VerifyNftCreatorOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type VerifyNftCreatorInput = {
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
export declare type VerifyNftCreatorOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const verifyNftCreatorOperationHandler: OperationHandler<VerifyNftCreatorOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type VerifyNftCreatorBuilderParams = Omit<VerifyNftCreatorInput, 'confirmOptions'> & {
    /** A key to distinguish the instruction that verifies the creator. */
    instructionKey?: string;
};
/**
 * Verifies the creator of an NFT or SFT.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .verifyCreator({ mintAddress, creator });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const verifyNftCreatorBuilder: (metaplex: Metaplex, params: VerifyNftCreatorBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder;
export {};
