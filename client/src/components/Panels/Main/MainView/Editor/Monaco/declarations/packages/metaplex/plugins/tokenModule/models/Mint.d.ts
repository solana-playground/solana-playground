import type { PublicKey } from '@solana/web3.js';
import { MintAccount } from '../accounts';
import { SplTokenCurrency, SplTokenAmount } from '../../../types';
import { Option } from '../../../utils';
/**
 * This model represents a mint account.
 *
 * @group Models
 */
export declare type Mint = {
    /** A model identifier to distinguish models in the SDK. */
    readonly model: 'mint';
    /** The address of the mint account. */
    readonly address: PublicKey;
    /**
     * The address of the authority that is allowed
     * to mint new tokens to token accounts.
     *
     * When `null`, no authority is ever allowed to mint new tokens.
     */
    readonly mintAuthorityAddress: Option<PublicKey>;
    /**
     * The address of the authority that is allowed
     * to freeze token accounts.
     *
     * When `null`, no authority is ever allowed to freeze token accounts.
     */
    readonly freezeAuthorityAddress: Option<PublicKey>;
    /**
     * The number of decimal points used to define token amounts.
     */
    readonly decimals: number;
    /**
     * The current supply of tokens across all token accounts.
     */
    readonly supply: SplTokenAmount;
    /**
     * Helper boolean to determine whether this mint account is the
     * mint account that wraps SOL as an SPL token.
     */
    readonly isWrappedSol: boolean;
    /**
     * A currency object that can be used to create amounts
     * representing the tokens of this mint account.
     *
     * For instance, here's how you can transform an amount of token
     * in basis points into an `Amount` object.
     *
     * ```ts
     * const tokenBasisPoints = 1000;
     * const tokensAsAmount = amount(tokenBasisPoints, mint.currency);
     * ```
     */
    readonly currency: SplTokenCurrency;
};
/** @group Model Helpers */
export declare const isMint: (value: any) => value is Mint;
/** @group Model Helpers */
export declare function assertMint(value: any): asserts value is Mint;
/** @group Model Helpers */
export declare const toMint: (account: MintAccount) => Mint;
