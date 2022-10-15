import { PublicKey } from '../../../types';
/**
 * The nftBurn guard restricts the mint to holders of a predefined
 * NFT Collection and burns the holder's NFT when minting.
 *
 * This means the mint address of the NFT to burn must be
 * passed when minting. This guard alone does not limit how many
 * times a holder can mint. A holder can mint as many times
 * as they have NFTs from the required collection to burn.
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 *
 * @see {@link NftBurnGuardMintSettings} for more
 * information on the mint settings of this guard.
 */
export declare type NftBurnGuardSettings = {
    /** The mint address of the required NFT Collection. */
    requiredCollection: PublicKey;
};
/**
 * The settings for the nftBurn guard that could
 * be provided when minting from the Candy Machine.
 *
 * @see {@link NftBurnGuardSettings} for more
 * information on the nftBurn guard itself.
 */
export declare type NftBurnGuardMintSettings = {
    /**
     * The mint address of the NFT to burn.
     * This must be part of the required collection and must
     * belong to the payer.
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
