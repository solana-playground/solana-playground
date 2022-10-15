import { PublicKey, SplTokenAmount } from '../../../types';
/**
 * The tokenGate guard restricts minting to token holders
 * of a specified mint account. The `amount` determines
 * how many tokens are required.
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 *
 * @see {@link TokenGateGuardMintSettings} for more
 * information on the mint settings of this guard.
 */
export declare type TokenGateGuardSettings = {
    /** The mint address of the required tokens. */
    mint: PublicKey;
    /** The amount of tokens required to mint an NFT. */
    amount: SplTokenAmount;
};
/**
 * The settings for the tokenGate guard that could
 * be provided when minting from the Candy Machine.
 *
 * @see {@link TokenGateGuardSettings} for more
 * information on the tokenGate guard itself.
 */
export declare type TokenGateGuardMintSettings = {
    /**
     * The token account linking the mint
     * account with the token holder.
     *
     * @defaultValue
     * Defaults to the associated token address using the
     * mint address and the payer's address.
     */
    tokenAccount?: PublicKey;
};
