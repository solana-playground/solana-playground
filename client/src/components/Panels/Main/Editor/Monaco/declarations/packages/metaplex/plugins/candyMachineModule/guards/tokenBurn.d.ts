import { PublicKey, SplTokenAmount } from '../../../types';
/**
 * The tokenBurn guard restricts minting to token holders
 * of a specified mint account and burns the holder's tokens
 * when minting. The `amount` determines how many tokens are required.
 *
 * This guard alone does not limit how many times a holder
 * can mint. A holder can mint as many times as they have
 * the required amount of tokens to burn.
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 */
export declare type TokenBurnGuardSettings = {
    /** The mint address of the required tokens. */
    mint: PublicKey;
    /** The amount of tokens required to mint an NFT. */
    amount: SplTokenAmount;
};
