import { PublicKey } from '../../../types';
/**
 * The nftGate guard restricts minting to holders
 * of a specified NFT collection.
 *
 * This means the mint address of an NFT from this
 * collection must be passed when minting.
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 *
 * @see {@link NftGateGuardMintSettings} for more
 * information on the mint settings of this guard.
 */
export declare type NftGateGuardSettings = {
    /** The mint address of the required NFT Collection. */
    requiredCollection: PublicKey;
};
/**
 * The settings for the nftGate guard that could
 * be provided when minting from the Candy Machine.
 *
 * @see {@link NftGateGuardSettings} for more
 * information on the nftGate guard itself.
 */
export declare type NftGateGuardMintSettings = {
    /**
     * The mint address of an NFT from the required
     * collection that belongs to the payer.
     */
    mint: PublicKey;
    /**
     * The token account linking the NFT with its owner.
     *
     * @defaultValue
     * Defaults to the associated token address using the
     * mint address of the NFT and the payer's address.
     */
    tokenAccount?: PublicKey;
};
