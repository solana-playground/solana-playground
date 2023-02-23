import { Uses } from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Sft, SftWithToken } from '../models';
import { Option, TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
import { CreatorInput, Operation, OperationHandler, Signer, SplTokenAmount } from '../../../types';
import { Metaplex } from '../../../Metaplex';
declare const Key: "CreateSftOperation";
/**
 * Creates a new SFT.
 *
 * ```ts
 * const { sft } = await metaplex
 *   .nfts()
 *   .createSft({
 *     name: 'My SFT',
 *     uri: 'https://example.com/my-sft',
 *     sellerFeeBasisPoints: 250, // 2.5%
 *   };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const createSftOperation: import("../../../types").OperationConstructor<CreateSftOperation, "CreateSftOperation", CreateSftInput, CreateSftOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type CreateSftOperation = Operation<typeof Key, CreateSftInput, CreateSftOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type CreateSftInput = {
    /**
     * The authority that will be able to make changes
     * to the created SFT.
     *
     * This is required as a Signer because creating the
     * metadata account requires the update authority to be part
     * of the creators array as a verified creator.
     *
     * @defaultValue `metaplex.identity()`
     */
    updateAuthority?: Signer;
    /**
     * The authority allowed to mint new tokens for the mint account
     * that is either explicitly provided or about to be created.
     *
     * @defaultValue `metaplex.identity()`
     */
    mintAuthority?: Signer;
    /**
     * The authority allowed to freeze token account associated with the
     * mint account that is either explicitly provided or about to be created.
     *
     * @defaultValue `metaplex.identity().publicKey`
     */
    freezeAuthority?: Option<PublicKey>;
    /**
     * The address of the new mint account as a Signer.
     * This is useful if you already have a generated Keypair
     * for the mint account of the SFT to create.
     *
     * @defaultValue `Keypair.generate()`
     */
    useNewMint?: Signer;
    /**
     * The address of the existing mint account that should be converted
     * into an SFT. The account at this address should have the right
     * requirements to become an SFT, e.g. it shouldn't already have
     * a metadata account associated with it.
     *
     * @defaultValue Defaults to creating a new mint account with the
     * right requirements.
     */
    useExistingMint?: PublicKey;
    /**
     * The owner of a token account associated with the SFT to create.
     *
     * This is completely optional as creating an SFT does not require
     * the existence of a token account. When provided, an associated
     * token account will be created from the given owner.
     *
     * You may alternatively pass the `tokenAddress` parameter instead.
     *
     * @defaultValue Defaults to not creating and/or minting
     * any token account.
     */
    tokenOwner?: PublicKey;
    /**
     * An explicit token account associated with the SFT to create.
     *
     * This is completely optional as creating an SFT does not require
     * the existence of a token account.
     *
     * When provided, the token account will be created if and only
     * if no account exists at the given address. When that's the case,
     * the `tokenAddress` must be provided as a Signer as we're creating
     * and initializing the account at this address.
     *
     * You may alternatively pass the `tokenOwner` parameter instead.
     *
     * @defaultValue Defaults to not creating and/or minting
     * any token account.
     */
    tokenAddress?: PublicKey | Signer;
    /**
     * The amount of tokens to mint to the token account initially
     * if a token account is created.
     *
     * This is only relevant if either the `tokenOwner` or `tokenAddress`
     * is provided.
     *
     * @defaultValue Defaults to not minting any tokens.
     */
    tokenAmount?: SplTokenAmount;
    /**
     * The number of decimal points used to define token amounts.
     *
     * @defaultValue `0`
     */
    decimals?: number;
    /** The URI that points to the JSON metadata of the asset. */
    uri: string;
    /** The on-chain name of the asset, e.g. "My SFT". */
    name: string;
    /**
     * The royalties in percent basis point (i.e. 250 is 2.5%) that
     * should be paid to the creators on each secondary sale.
     */
    sellerFeeBasisPoints: number;
    /**
     * The on-chain symbol of the asset, stored in the Metadata account.
     * E.g. "MYSFT".
     *
     * @defaultValue `""`
     */
    symbol?: string;
    /**
     * {@inheritDoc CreatorInput}
     * @defaultValue
     * Defaults to using the provided `updateAuthority` as the only verified creator.
     * ```ts
     * [{
     *   address: updateAuthority.publicKey,
     *   authority: updateAuthority,
     *   share: 100,
     * }]
     * ```
     */
    creators?: CreatorInput[];
    /**
     * Whether or not the SFT's metadata is mutable.
     * When set to `false` no one can update the Metadata account,
     * not even the update authority.
     *
     * @defaultValue `true`
     */
    isMutable?: boolean;
    /**
     * When this field is not `null`, it indicates that the SFT
     * can be "used" by its owner or any approved "use authorities".
     *
     * @defaultValue `null`
     */
    uses?: Option<Uses>;
    /**
     * Whether the created SFT is a Collection SFT.
     * When set to `true`, the SFT will be created as a
     * Sized Collection SFT with an initial size of 0.
     *
     * @defaultValue `false`
     */
    isCollection?: boolean;
    /**
     * The Collection NFT that this new SFT belongs to.
     * When `null`, the created SFT will not be part of a collection.
     *
     * @defaultValue `null`
     */
    collection?: Option<PublicKey>;
    /**
     * The collection authority that should sign the created SFT
     * to prove that it is part of the provided collection.
     * When `null`, the provided `collection` will not be verified.
     *
     * @defaultValue `null`
     */
    collectionAuthority?: Option<Signer>;
    /**
     * Whether or not the provided `collectionAuthority` is a delegated
     * collection authority, i.e. it was approved by the update authority
     * using `metaplex.nfts().approveCollectionAuthority()`.
     *
     * @defaultValue `false`
     */
    collectionAuthorityIsDelegated?: boolean;
    /**
     * Whether or not the provided `collection` is a sized collection
     * and not a legacy collection.
     *
     * @defaultValue `true`
     */
    collectionIsSized?: boolean;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type CreateSftOutput = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
    /** The newly created SFT and, potentially, its associated token. */
    sft: Sft | SftWithToken;
    /** The address of the mint account. */
    mintAddress: PublicKey;
    /** The address of the metadata account. */
    metadataAddress: PublicKey;
    /** The address of the token account if any. */
    tokenAddress: PublicKey | null;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const createSftOperationHandler: OperationHandler<CreateSftOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type CreateSftBuilderParams = Omit<CreateSftInput, 'confirmOptions'> & {
    /**
     * Whether or not the provided token account already exists.
     * If `false`, we'll add another instruction to create it.
     *
     * @defaultValue `true`
     */
    tokenExists?: boolean;
    /** A key to distinguish the instruction that creates the mint account. */
    createMintAccountInstructionKey?: string;
    /** A key to distinguish the instruction that initializes the mint account. */
    initializeMintInstructionKey?: string;
    /** A key to distinguish the instruction that creates the associated token account. */
    createAssociatedTokenAccountInstructionKey?: string;
    /** A key to distinguish the instruction that creates the token account. */
    createTokenAccountInstructionKey?: string;
    /** A key to distinguish the instruction that initializes the token account. */
    initializeTokenInstructionKey?: string;
    /** A key to distinguish the instruction that mints tokens. */
    mintTokensInstructionKey?: string;
    /** A key to distinguish the instruction that creates the metadata account. */
    createMetadataInstructionKey?: string;
};
/**
 * @group Transaction Builders
 * @category Contexts
 */
export declare type CreateSftBuilderContext = Omit<CreateSftOutput, 'response' | 'sft'>;
/**
 * Creates a new SFT.
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .nfts()
 *   .builders()
 *   .createSft({
 *     name: 'My SFT',
 *     uri: 'https://example.com/my-sft',
 *     sellerFeeBasisPoints: 250, // 2.5%
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const createSftBuilder: (metaplex: Metaplex, params: CreateSftBuilderParams, options?: TransactionBuilderOptions) => Promise<TransactionBuilder<CreateSftBuilderContext>>;
export {};
