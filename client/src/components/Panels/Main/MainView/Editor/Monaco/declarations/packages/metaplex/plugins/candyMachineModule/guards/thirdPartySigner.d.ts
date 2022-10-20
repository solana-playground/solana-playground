import { PublicKey, Signer } from '../../../types';
/**
 * The thirdPartySigner guard requires a predefined
 * address to sign the mint transaction. The signer will need
 * to be passed within the mint settings of this guard.
 *
 * This allows for more centralized mints where every single
 * mint transaction has to go through a specific signer.
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 *
 * @see {@link ThirdPartySignerGuardMintSettings} for more
 * information on the mint settings of this guard.
 */
export declare type ThirdPartySignerGuardSettings = {
    /**
     * The address of the signer that will
     * need to sign each mint transaction.
     */
    signerKey: PublicKey;
};
/**
 * The settings for the thirdPartySigner guard that could
 * be provided when minting from the Candy Machine.
 *
 * @see {@link ThirdPartySignerGuardSettings} for more
 * information on the thirdPartySigner guard itself.
 */
export declare type ThirdPartySignerGuardMintSettings = {
    /** The required third party signer. */
    signer: Signer;
};
