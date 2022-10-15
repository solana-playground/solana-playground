import type { PublicKey } from '@solana/web3.js';
import type { Mint, Token } from '../../tokenModule';
import type { Metadata } from './Metadata';
import { Pda } from '../../../types';
/** @group Models */
export declare type Sft = Omit<Metadata, 'model' | 'address' | 'mintAddress'> & Readonly<{
    model: 'sft';
    /** The mint address of the SFT. */
    address: PublicKey;
    /** The metadata address of the SFT. */
    metadataAddress: Pda;
    /** The mint account of the SFT. */
    mint: Mint;
}>;
/** @group Model Helpers */
export declare const isSft: (value: any) => value is Sft;
/** @group Model Helpers */
export declare function assertSft(value: any): asserts value is Sft;
/** @group Model Helpers */
export declare const toSft: (metadata: Metadata, mint: Mint) => Sft;
/** @group Models */
export declare type SftWithToken = Sft & {
    token: Token;
};
/** @group Model Helpers */
export declare const isSftWithToken: (value: any) => value is SftWithToken;
/** @group Model Helpers */
export declare function assertSftWithToken(value: any): asserts value is SftWithToken;
/** @group Model Helpers */
export declare const toSftWithToken: (metadata: Metadata, mint: Mint, token: Token) => SftWithToken;
