import { ApproveNftCollectionAuthorityBuilderParams, ApproveNftUseAuthorityBuilderParams, CreateNftBuilderParams, CreateSftBuilderParams, DeleteNftBuilderParams, FreezeDelegatedNftBuilderParams, MigrateToSizedCollectionNftBuilderParams, PrintNewEditionBuilderParams, RevokeNftCollectionAuthorityBuilderParams, RevokeNftUseAuthorityBuilderParams, ThawDelegatedNftBuilderParams, UnverifyNftCollectionBuilderParams, UnverifyNftCreatorBuilderParams, UpdateNftBuilderParams, UseNftBuilderParams, VerifyNftCollectionBuilderParams, VerifyNftCreatorBuilderParams } from './operations';
import type { Metaplex } from '../../Metaplex';
import { TransactionBuilderOptions } from '../../utils';
/**
 * This client allows you to access the underlying Transaction Builders
 * for the write operations of the NFT module.
 *
 * @see {@link NftClient}
 * @group Module Builders
 * */
export declare class NftBuildersClient {
    protected readonly metaplex: Metaplex;
    constructor(metaplex: Metaplex);
    /** {@inheritDoc createNftBuilder} */
    create(input: CreateNftBuilderParams, options?: TransactionBuilderOptions): Promise<import("../../utils").TransactionBuilder<import("./operations").CreateNftBuilderContext>>;
    /** {@inheritDoc createSftBuilder} */
    createSft(input: CreateSftBuilderParams, options?: TransactionBuilderOptions): Promise<import("../../utils").TransactionBuilder<import("./operations").CreateSftBuilderContext>>;
    /** {@inheritDoc printNewEditionBuilder} */
    printNewEdition(input: PrintNewEditionBuilderParams, options?: TransactionBuilderOptions): Promise<import("../../utils").TransactionBuilder<import("./operations").PrintNewEditionBuilderContext>>;
    /** {@inheritDoc updateNftBuilder} */
    update(input: UpdateNftBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc deleteNftBuilder} */
    delete(input: DeleteNftBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc useNftBuilder} */
    use(input: UseNftBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc approveNftUseAuthorityBuilder} */
    approveUseAuthority(input: ApproveNftUseAuthorityBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc revokeNftUseAuthorityBuilder} */
    revokeUseAuthority(input: RevokeNftUseAuthorityBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc verifyNftCreatorBuilder} */
    verifyCreator(input: VerifyNftCreatorBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc unverifyNftCreatorBuilder} */
    unverifyCreator(input: UnverifyNftCreatorBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc verifyNftCollectionBuilder} */
    verifyCollection(input: VerifyNftCollectionBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc unverifyNftCollectionBuilder} */
    unverifyCollection(input: UnverifyNftCollectionBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc approveNftCollectionAuthorityBuilder} */
    approveCollectionAuthority(input: ApproveNftCollectionAuthorityBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc revokeNftCollectionAuthorityBuilder} */
    revokeCollectionAuthority(input: RevokeNftCollectionAuthorityBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc migrateToSizedCollectionNftBuilder} */
    migrateToSizedCollection(input: MigrateToSizedCollectionNftBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc freezeDelegatedNftBuilder} */
    freezeDelegatedNft(input: FreezeDelegatedNftBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc thawDelegatedNftBuilder} */
    thawDelegatedNft(input: ThawDelegatedNftBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
}
