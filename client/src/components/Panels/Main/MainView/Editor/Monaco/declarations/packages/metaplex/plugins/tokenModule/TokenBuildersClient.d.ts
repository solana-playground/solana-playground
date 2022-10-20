import { ApproveTokenDelegateAuthorityBuilderParams, CreateMintBuilderParams, CreateTokenBuilderParams, CreateTokenWithMintBuilderParams, FreezeTokensBuilderParams, MintTokensBuilderParams, RevokeTokenDelegateAuthorityBuilderParams, SendTokensBuilderParams, ThawTokensBuilderParams } from './operations';
import type { Metaplex } from '../../Metaplex';
import { TransactionBuilderOptions } from '../../utils';
/**
 * This client allows you to access the underlying Transaction Builders
 * for the write operations of the Token module.
 *
 * @see {@link TokenClient}
 * @group Module Builders
 * */
export declare class TokenBuildersClient {
    protected readonly metaplex: Metaplex;
    constructor(metaplex: Metaplex);
    /** {@inheritDoc createMintBuilder} */
    createMint(input: CreateMintBuilderParams, options?: TransactionBuilderOptions): Promise<import("../../utils").TransactionBuilder<import("./operations").CreateMintBuilderContext>>;
    /** {@inheritDoc createTokenBuilder} */
    createToken(input: CreateTokenBuilderParams, options?: TransactionBuilderOptions): Promise<import("../../utils").TransactionBuilder<import("./operations").CreateTokenBuilderContext>>;
    /** {@inheritDoc createTokenWithMintBuilder} */
    createTokenWithMint(input: CreateTokenWithMintBuilderParams, options?: TransactionBuilderOptions): Promise<import("../../utils").TransactionBuilder<import("./operations").CreateTokenWithMintBuilderContext>>;
    /** {@inheritDoc mintTokensBuilder} */
    mint(input: MintTokensBuilderParams, options?: TransactionBuilderOptions): Promise<import("../../utils").TransactionBuilder<object>>;
    /** {@inheritDoc sendTokensBuilder} */
    send(input: SendTokensBuilderParams, options?: TransactionBuilderOptions): Promise<import("../../utils").TransactionBuilder<object>>;
    /** {@inheritDoc freezeTokensBuilder} */
    freeze(input: FreezeTokensBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc thawTokensBuilder} */
    thaw(input: ThawTokensBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc approveTokenDelegateAuthorityBuilder} */
    approveDelegateAuthority(input: ApproveTokenDelegateAuthorityBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc revokeTokenDelegateAuthorityBuilder} */
    revokeDelegateAuthority(input: RevokeTokenDelegateAuthorityBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
}
