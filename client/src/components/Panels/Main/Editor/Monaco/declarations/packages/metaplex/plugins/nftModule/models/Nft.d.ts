import type { PublicKey } from '@solana/web3.js';
import type { Mint, Token } from '../../tokenModule';
import type { Metadata } from './Metadata';
import type { NftEdition } from './NftEdition';
import { SftWithToken } from './Sft';
import type { Pda } from '../../../types';
/**
 * This model captures all the relevant information about an NFT
 * in the Solana blockchain. That includes the NFT's metadata account,
 * its mint account, its edition account and its off-chain JSON metadata.
 *
 * @group Models
 */
export declare type Nft = Omit<Metadata, 'model' | 'address' | 'mintAddress'> & {
    /** A model identifier to distinguish models in the SDK. */
    readonly model: 'nft';
    /** The mint address of the NFT. */
    readonly address: PublicKey;
    /** The metadata address of the NFT. */
    readonly metadataAddress: Pda;
    /** The mint account of the NFT. */
    readonly mint: Mint;
    /**
     * Defines whether the NFT is an original edition or a
     * printed edition and provides additional information accordingly.
     */
    readonly edition: NftEdition;
};
/** @group Model Helpers */
export declare const isNft: (value: any) => value is Nft;
/** @group Model Helpers */
export declare function assertNft(value: any): asserts value is Nft;
/** @group Model Helpers */
export declare const toNft: (metadata: Metadata, mint: Mint, edition: NftEdition) => Nft;
/** @group Models */
export declare type NftWithToken = Nft & {
    token: Token;
};
/** @group Model Helpers */
export declare const isNftWithToken: (value: any) => value is NftWithToken;
/** @group Model Helpers */
export declare function assertNftWithToken(value: any): asserts value is NftWithToken;
/** @group Model Helpers */
export declare function assertNftOrSftWithToken(value: any): asserts value is NftWithToken | SftWithToken;
/** @group Model Helpers */
export declare const toNftWithToken: (metadata: Metadata, mint: Mint, edition: NftEdition, token: Token) => NftWithToken;
