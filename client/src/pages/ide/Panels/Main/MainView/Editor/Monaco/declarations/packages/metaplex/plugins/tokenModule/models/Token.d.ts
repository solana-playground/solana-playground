import type { PublicKey } from '@solana/web3.js';
import { AccountState } from '@solana/spl-token';
import { TokenAccount } from '../accounts';
import { Mint } from './Mint';
import { Pda, SplTokenAmount } from '../../../types';
import { Option } from '../../../utils';
/**
 * This model represents a token account.
 *
 * @group Models
 */
export declare type Token = {
    /** A model identifier to distinguish models in the SDK. */
    readonly model: 'token';
    /** The address of the token account. */
    readonly address: PublicKey | Pda;
    /** Whether or not this is an associated token account. */
    readonly isAssociatedToken: boolean;
    /** The address of the mint account. */
    readonly mintAddress: PublicKey;
    /** The address of the owner of this token account. */
    readonly ownerAddress: PublicKey;
    /** The amount of tokens held in this account. */
    readonly amount: SplTokenAmount;
    /**
     * The address of the authority that can close the account.
     * This field is optional and may be `null`.
     */
    readonly closeAuthorityAddress: Option<PublicKey>;
    /**
     * The address of the authority that can act on behalf of the owner
     * of the account. This field is optional and may be `null`.
     */
    readonly delegateAddress: Option<PublicKey>;
    /**
     * The amount of tokens that were delegated to the delegate authority.
     * This means the delegate authority cannot transfer more tokens
     * than this amount even if the token account has more tokens available.
     *
     * This field is only relevant if the account has a delegate authority.
     */
    readonly delegateAmount: SplTokenAmount;
    /**
     * The state of the token account.
     * It is mostly used to determine whether or not the account is frozen.
     *
     * It can be one of the following:
     * - `AccountState.Uninitialized`: The account has not been initialized.
     *   This should never happen in this model since the SDK would fail to
     *   parse this model if it were uninitialized.
     * - `AccountState.Initialized`: The account has been initialized and is not frozen.
     * - `AccountState.Frozen`: The account has been initialized and is frozen.
     */
    readonly state: AccountState;
};
/** @group Model Helpers */
export declare const isToken: (value: any) => value is Token;
/** @group Model Helpers */
export declare function assertToken(value: any): asserts value is Token;
/** @group Model Helpers */
export declare const toToken: (account: TokenAccount) => Token;
/** @group Models */
export declare type TokenWithMint = Omit<Token, 'model' | 'mintAddress'> & Readonly<{
    model: 'tokenWithMint';
    mint: Mint;
}>;
/** @group Model Helpers */
export declare const isTokenWithMint: (value: any) => value is TokenWithMint;
/** @group Model Helpers */
export declare function assertTokenWithMint(value: any): asserts value is TokenWithMint;
/** @group Model Helpers */
export declare const toTokenWithMint: (tokenAccount: TokenAccount, mintModel: Mint) => TokenWithMint;
