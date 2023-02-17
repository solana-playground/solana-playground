import { PublicKey } from '@solana/web3.js';
import { Signer } from './Signer';
/**
 * Object that represents the creator of an asset.
 * It contains its public key, its shares of the royalties in percent
 * and whether or not the creator is verified for a given asset
 * (i.e. they signed the asset).
 *
 * @group Models
 */
export declare type Creator = {
    /** The public key of the creator. */
    readonly address: PublicKey;
    /** Whether or not the creator is verified for the asset. */
    readonly verified: boolean;
    /** The creator's shares of the royalties in percent (i.e. 5 is 5%). */
    readonly share: number;
};
/**
 * This object provides a way of providing creator information when needed,
 * e.g. when creating or updating NFTs, candy machines, etc.
 *
 * It allows us to optionally provide an authority as a Signer so we can
 * both set and verify the creator within the same operation.
 *
 * @group Operations
 * @category Inputs
 */
export declare type CreatorInput = {
    /** The public key of the creator. */
    readonly address: PublicKey;
    /** The creator's shares of the royalties in percent (i.e. 5 is 5%). */
    readonly share: number;
    /**
     * The authority that should sign the asset to verify the creator.
     * When this is not provided, the creator will not be
     * verified within this operation.
     */
    readonly authority?: Signer;
};
