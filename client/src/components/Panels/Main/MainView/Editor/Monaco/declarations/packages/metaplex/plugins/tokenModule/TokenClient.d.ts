import { ApproveTokenDelegateAuthorityInput, CreateMintInput, CreateTokenInput, CreateTokenWithMintInput, FindMintByAddressInput, FindTokenByAddressInput, FindTokenWithMintByAddressInput, FindTokenWithMintByMintInput, FreezeTokensInput, MintTokensInput, RevokeTokenDelegateAuthorityInput, SendTokensInput, ThawTokensInput } from './operations';
import { TokenBuildersClient } from './TokenBuildersClient';
import { TokenPdasClient } from './TokenPdasClient';
import type { Metaplex } from '../../Metaplex';
import { OperationOptions } from '../../types';
/**
 * This is a client for the Token module.
 *
 * It enables us to interact with the SPL Token program in order to
 * create, send, freeze, thaw, and mint tokens.
 *
 * You may access this client via the `tokens()` method of your `Metaplex` instance.
 *
 * ```ts
 * const tokenClient = metaplex.tokens();
 * ```
 *
 * @example
 * You can create a new mint account with an associated token account like so.
 * The owner of this token account will, by default, be the current identity
 * of the metaplex instance.
 *
 * ```ts
 * const { token } = await metaplex.tokens().createTokenWithMint();
 * ```
 *
 * @group Modules
 */
export declare class TokenClient {
    protected readonly metaplex: Metaplex;
    constructor(metaplex: Metaplex);
    /**
     * You may use the `builders()` client to access the
     * underlying Transaction Builders of this module.
     *
     * ```ts
     * const buildersClient = metaplex.tokens().builders();
     * ```
     */
    builders(): TokenBuildersClient;
    /**
     * You may use the `pdas()` client to build PDAs related to this module.
     *
     * ```ts
     * const pdasClient = metaplex.tokens().pdas();
     * ```
     */
    pdas(): TokenPdasClient;
    /** {@inheritDoc findMintByAddressOperation} */
    findMintByAddress(input: FindMintByAddressInput, options?: OperationOptions): Promise<import("./models").Mint>;
    /** {@inheritDoc findTokenByAddressOperation} */
    findTokenByAddress(input: FindTokenByAddressInput, options?: OperationOptions): Promise<import("./models").Token>;
    /** {@inheritDoc findTokenWithMintByAddressOperation} */
    findTokenWithMintByAddress(input: FindTokenWithMintByAddressInput, options?: OperationOptions): Promise<import("./models").TokenWithMint>;
    /** {@inheritDoc findTokenWithMintByMintOperation} */
    findTokenWithMintByMint(input: FindTokenWithMintByMintInput, options?: OperationOptions): Promise<import("./models").TokenWithMint>;
    /** {@inheritDoc createMintOperation} */
    createMint(input?: CreateMintInput, options?: OperationOptions): Promise<import("./operations").CreateMintOutput>;
    /**
     * Create a new Token account from the provided input
     * and returns the newly created `Token` model.
     */
    /** {@inheritDoc createTokenOperation} */
    createToken(input: CreateTokenInput, options?: OperationOptions): Promise<import("./operations").CreateTokenOutput>;
    /** {@inheritDoc createTokenWithMintOperation} */
    createTokenWithMint(input?: CreateTokenWithMintInput, options?: OperationOptions): Promise<import("./operations").CreateTokenWithMintOutput>;
    /** {@inheritDoc mintTokensOperation} */
    mint(input: MintTokensInput, options?: OperationOptions): Promise<import("./operations").MintTokensOutput>;
    /** {@inheritDoc sendTokensOperation} */
    send(input: SendTokensInput, options?: OperationOptions): Promise<import("./operations").SendTokensOutput>;
    /** {@inheritDoc freezeTokensOperation} */
    freeze(input: FreezeTokensInput, options?: OperationOptions): Promise<import("./operations").FreezeTokensOutput>;
    /** {@inheritDoc thawTokensOperation} */
    thaw(input: ThawTokensInput, options?: OperationOptions): Promise<import("./operations").ThawTokensOutput>;
    /** {@inheritDoc approveTokenDelegateAuthorityOperation} */
    approveDelegateAuthority(input: ApproveTokenDelegateAuthorityInput, options?: OperationOptions): Promise<import("./operations").ApproveTokenDelegateAuthorityOutput>;
    /** {@inheritDoc revokeTokenDelegateAuthorityOperation} */
    revokeDelegateAuthority(input: RevokeTokenDelegateAuthorityInput, options?: OperationOptions): Promise<import("./operations").RevokeTokenDelegateAuthorityOutput>;
}
