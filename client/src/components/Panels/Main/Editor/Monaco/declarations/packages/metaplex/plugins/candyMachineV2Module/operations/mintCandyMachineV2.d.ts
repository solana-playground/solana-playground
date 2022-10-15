import { PublicKey } from '@solana/web3.js';
import { NftWithToken } from '../../nftModule';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { CandyMachineV2 } from '../models';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
import { Operation, OperationHandler, Signer } from '../../../types';
import { Metaplex } from '../../../Metaplex';
declare const Key: "MintCandyMachineV2Operation";
/**
 * Mint an NFT from an existing Candy Machine.
 *
 * ```ts
 * const { nft } = await metaplex
 *   .candyMachinesV2()
 *   .mint({ candyMachine };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const mintCandyMachineV2Operation: import("../../../types").OperationConstructor<MintCandyMachineV2Operation, "MintCandyMachineV2Operation", MintCandyMachineV2Input, MintCandyMachineV2Output>;
/**
 * @group Operations
 * @category Types
 */
export declare type MintCandyMachineV2Operation = Operation<typeof Key, MintCandyMachineV2Input, MintCandyMachineV2Output>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type MintCandyMachineV2Input = {
    /**
     * The Candy Machine to mint from.
     * We only need a subset of the `CandyMachine` model but we
     * need enough information regarding its settings to know how
     * to mint from it.
     *
     * This includes, its wallet address, its item statistics, it live date,
     * its whitelist settings, etc.
     */
    candyMachine: Pick<CandyMachineV2, 'address' | 'walletAddress' | 'authorityAddress' | 'tokenMintAddress' | 'itemsRemaining' | 'itemsAvailable' | 'itemsMinted' | 'whitelistMintSettings' | 'goLiveDate' | 'endSettings'>;
    /**
     * The mint account to create as a Signer.
     * This expects a brand new Keypair with no associated account.
     *
     * @defaultValue `Keypair.generate()`
     */
    newMint?: Signer;
    /**
     * The owner of the minted NFT.
     *
     * @defaultValue `metaplex.identity().publicKey`
     */
    newOwner?: PublicKey;
    /**
     * The new token account to create as a Signer.
     *
     * This property would typically be ignored as, by default, it will create a
     * associated token account from the `newOwner` and `newMint` properties.
     *
     * When provided, the `newOwner` property will be ignored.
     *
     * @defaultValue associated token address of `newOwner` and `newMint`.
     */
    newToken?: Signer;
    /**
     * The token account that should pay for the minted NFT.
     *
     * This is only relevant when the Candy Machine uses a mint treasury
     * (i.e. payments are made using SPL tokens and not SOL).
     *
     * @defaultValue associated token address of `payer` and
     * `candyMachine.tokenMintAddress`.
     */
    payerToken?: PublicKey;
    /**
     * The token account that contains whitelist tokens.
     *
     * This is only relevant when the Candy Machine uses
     * whitelist settings.
     *
     * @defaultValue associated token address of `payer` and
     * `candyMachine.whitelistMintSettings.mint`.
     */
    whitelistToken?: PublicKey;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type MintCandyMachineV2Output = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
    /** The minted NFT. */
    nft: NftWithToken;
    /** The mint account of the minted NFT as a Signer. */
    mintSigner: Signer;
    /** The token account's address of the minted NFT. */
    tokenAddress: PublicKey;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const mintCandyMachineV2OperationHandler: OperationHandler<MintCandyMachineV2Operation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type MintCandyMachineV2BuilderParams = Omit<MintCandyMachineV2Input, 'confirmOptions'> & {
    /** A key to distinguish the instruction that creates the mint account of the NFT. */
    createMintAccountInstructionKey?: string;
    /** A key to distinguish the instruction that initializes the mint account of the NFT. */
    initializeMintInstructionKey?: string;
    /** A key to distinguish the instruction that creates the associated token account of the NFT. */
    createAssociatedTokenAccountInstructionKey?: string;
    /** A key to distinguish the instruction that creates the token account of the NFT. */
    createTokenAccountInstructionKey?: string;
    /** A key to distinguish the instruction that initializes the token account of the NFT. */
    initializeTokenInstructionKey?: string;
    /** A key to distinguish the instruction that mints the one token. */
    mintTokensInstructionKey?: string;
    /** A key to distinguish the instruction that mints the NFT. */
    mintNftInstructionKey?: string;
    /** A key to distinguish the instruction that sets the collection on the minted NFT. */
    setCollectionInstructionKey?: string;
};
/**
 * @group Transaction Builders
 * @category Contexts
 */
export declare type MintCandyMachineV2BuilderContext = Omit<MintCandyMachineV2Output, 'response' | 'nft'>;
/**
 * Mint an NFT from an existing Candy Machine.
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .candyMachinesV2()
 *   .builders()
 *   .mint({ candyMachine });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const mintCandyMachineV2Builder: (metaplex: Metaplex, params: MintCandyMachineV2BuilderParams, options?: TransactionBuilderOptions) => Promise<TransactionBuilder<MintCandyMachineV2BuilderContext>>;
export {};
