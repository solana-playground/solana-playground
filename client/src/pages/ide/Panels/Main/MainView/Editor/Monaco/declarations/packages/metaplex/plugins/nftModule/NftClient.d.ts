import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey } from '@solana/web3.js';
import { SendTokensInput } from '../tokenModule';
import { Nft, NftWithToken, Sft, SftWithToken } from './models';
import { NftBuildersClient } from './NftBuildersClient';
import { NftPdasClient } from './NftPdasClient';
import { ApproveNftCollectionAuthorityInput, ApproveNftUseAuthorityInput, CreateNftInput, CreateSftInput, DeleteNftInput, FindNftByMetadataInput, FindNftByMintInput, FindNftByTokenInput, FindNftsByCreatorInput, FindNftsByMintListInput, FindNftsByOwnerInput, FindNftsByUpdateAuthorityInput, FreezeDelegatedNftInput, LoadMetadataInput, MigrateToSizedCollectionNftInput, PrintNewEditionInput, RevokeNftCollectionAuthorityInput, RevokeNftUseAuthorityInput, ThawDelegatedNftInput, UnverifyNftCollectionInput, UnverifyNftCreatorInput, UpdateNftInput, UploadMetadataInput, UseNftInput, VerifyNftCollectionInput, VerifyNftCreatorInput } from './operations';
import { PartialKeys } from '../../utils';
import { OperationOptions } from '../../types';
import type { Metaplex } from '../../Metaplex';
/**
 * This is a client for the NFT module.
 *
 * It enables us to interact with the Token Metadata program in order to
 * manage NFTs and SFTs.
 *
 * You may access this client via the `nfts()` method of your `Metaplex` instance.
 *
 * ```ts
 * const nftClient = metaplex.nfts();
 * ```
 *
 * @example
 * You can upload some custom JSON metadata and use its URI to create
 * a new NFT like so. The owner and update authority of this NFT will,
 * by default, be the current identity of the metaplex instance.
 *
 * ```ts
 * const { uri } = await metaplex
 *   .nfts()
 *   .uploadMetadata({
 *     name: "My off-chain name",
 *     description: "My off-chain description",
 *     image: "https://arweave.net/123",
 *   };
 *
 * const { nft } = await metaplex
 *   .nfts()
 *   .create({
 *     uri,
 *     name: 'My on-chain NFT',
 *     sellerFeeBasisPoints: 250, // 2.5%
 *   };
 * ```
 *
 * @group Modules
 */
export declare class NftClient {
    protected readonly metaplex: Metaplex;
    constructor(metaplex: Metaplex);
    /**
     * You may use the `builders()` client to access the
     * underlying Transaction Builders of this module.
     *
     * ```ts
     * const buildersClient = metaplex.nfts().builders();
     * ```
     */
    builders(): NftBuildersClient;
    /**
     * You may use the `pdas()` client to build PDAs related to this module.
     *
     * ```ts
     * const pdasClient = metaplex.nfts().pdas();
     * ```
     */
    pdas(): NftPdasClient;
    /** {@inheritDoc findNftByMintOperation} */
    findByMint(input: FindNftByMintInput, options?: OperationOptions): Promise<Sft | SftWithToken | Nft | NftWithToken>;
    /** {@inheritDoc findNftByMetadataOperation} */
    findByMetadata(input: FindNftByMetadataInput, options?: OperationOptions): Promise<Sft | SftWithToken | Nft | NftWithToken>;
    /** {@inheritDoc findNftByTokenOperation} */
    findByToken(input: FindNftByTokenInput, options?: OperationOptions): Promise<SftWithToken | NftWithToken>;
    /** {@inheritDoc findNftsByCreatorOperation} */
    findAllByCreator(input: FindNftsByCreatorInput, options?: OperationOptions): Promise<import("./operations").FindNftsByCreatorOutput>;
    /** {@inheritDoc findNftsByMintListOperation} */
    findAllByMintList(input: FindNftsByMintListInput, options?: OperationOptions): Promise<import("./operations").FindNftsByMintListOutput>;
    /** {@inheritDoc findNftsByOwnerOperation} */
    findAllByOwner(input: FindNftsByOwnerInput, options?: OperationOptions): Promise<import("./operations").FindNftsByOwnerOutput>;
    /** {@inheritDoc findNftsByUpdateAuthorityOperation} */
    findAllByUpdateAuthority(input: FindNftsByUpdateAuthorityInput, options?: OperationOptions): Promise<import("./operations").FindNftsByUpdateAuthorityOutput>;
    /** {@inheritDoc loadMetadataOperation} */
    load(input: LoadMetadataInput, options?: OperationOptions): Promise<Sft | SftWithToken | Nft | NftWithToken>;
    /**
     * Helper method that refetches a given model
     * and returns an instance of the same type.
     *
     * ```ts
     * nft = await metaplex.nfts().refresh(nft);
     * sft = await metaplex.nfts().refresh(sft);
     * nftWithToken = await metaplex.nfts().refresh(nftWithToken);
     * ```
     */
    refresh<T extends Nft | Sft | NftWithToken | SftWithToken | Metadata | PublicKey>(model: T, input?: Omit<FindNftByMintInput, 'mintAddress' | 'tokenAddres' | 'tokenOwner'>, options?: OperationOptions): Promise<T extends Metadata | PublicKey ? Nft | Sft : T>;
    /** {@inheritDoc createNftOperation} */
    create(input: CreateNftInput, options?: OperationOptions): Promise<import("./operations").CreateNftOutput>;
    /** {@inheritDoc createSftOperation} */
    createSft(input: CreateSftInput, options?: OperationOptions): Promise<import("./operations").CreateSftOutput>;
    /** {@inheritDoc printNewEditionOperation} */
    printNewEdition(input: PrintNewEditionInput, options?: OperationOptions): Promise<import("./operations").PrintNewEditionOutput>;
    /** {@inheritDoc uploadMetadataOperation} */
    uploadMetadata(input: UploadMetadataInput, options?: OperationOptions): Promise<import("./operations").UploadMetadataOutput>;
    /** {@inheritDoc updateNftOperation} */
    update(input: UpdateNftInput, options?: OperationOptions): Promise<import("./operations").UpdateNftOutput>;
    /** {@inheritDoc deleteNftOperation} */
    delete(input: DeleteNftInput, options?: OperationOptions): Promise<import("./operations").DeleteNftOutput>;
    /** {@inheritDoc useNftOperation} */
    use(input: UseNftInput, options?: OperationOptions): Promise<import("./operations").UseNftOutput>;
    /** {@inheritDoc approveNftUseAuthorityOperation} */
    approveUseAuthority(input: ApproveNftUseAuthorityInput, options?: OperationOptions): Promise<import("./operations").ApproveNftUseAuthorityOutput>;
    /** {@inheritDoc revokeNftUseAuthorityOperation} */
    revokeUseAuthority(input: RevokeNftUseAuthorityInput, options?: OperationOptions): Promise<import("./operations").RevokeNftUseAuthorityOutput>;
    /** {@inheritDoc verifyNftCreatorOperation} */
    verifyCreator(input: VerifyNftCreatorInput, options?: OperationOptions): Promise<import("./operations").VerifyNftCreatorOutput>;
    /** {@inheritDoc unverifyNftCreatorOperation} */
    unverifyCreator(input: UnverifyNftCreatorInput, options?: OperationOptions): Promise<import("./operations").UnverifyNftCreatorOutput>;
    /** {@inheritDoc verifyNftCollectionOperation} */
    verifyCollection(input: VerifyNftCollectionInput, options?: OperationOptions): Promise<import("./operations").VerifyNftCollectionOutput>;
    /** {@inheritDoc unverifyNftCollectionOperation} */
    unverifyCollection(input: UnverifyNftCollectionInput, options?: OperationOptions): Promise<import("./operations").UnverifyNftCollectionOutput>;
    /** {@inheritDoc approveNftCollectionAuthorityOperation} */
    approveCollectionAuthority(input: ApproveNftCollectionAuthorityInput, options?: OperationOptions): Promise<import("./operations").ApproveNftCollectionAuthorityOutput>;
    /** {@inheritDoc revokeNftCollectionAuthorityOperation} */
    revokeCollectionAuthority(input: RevokeNftCollectionAuthorityInput, options?: OperationOptions): Promise<import("./operations").RevokeNftCollectionAuthorityOutput>;
    /** {@inheritDoc migrateToSizedCollectionNftOperation} */
    migrateToSizedCollection(input: MigrateToSizedCollectionNftInput, options?: OperationOptions): Promise<import("./operations").MigrateToSizedCollectionNftOutput>;
    /** {@inheritDoc freezeDelegatedNftOperation} */
    freezeDelegatedNft(input: FreezeDelegatedNftInput, options?: OperationOptions): Promise<import("./operations").FreezeDelegatedNftOutput>;
    /** {@inheritDoc thawDelegatedNftOperation} */
    thawDelegatedNft(input: ThawDelegatedNftInput, options?: OperationOptions): Promise<import("./operations").ThawDelegatedNftOutput>;
    /** {@inheritDoc sendTokensOperation} */
    send(input: PartialKeys<SendTokensInput, 'amount'>, options?: OperationOptions): Promise<import("../tokenModule").SendTokensOutput>;
}
