import { PublicKey, PublicKeyInitData } from '@solana/web3.js';
export { PublicKey } from '@solana/web3.js';
export declare type PublicKeyString = string;
export declare type PublicKeyValues = PublicKeyInitData | {
    publicKey: PublicKey;
} | {
    address: PublicKey;
};
export declare const toPublicKey: (value: PublicKeyValues) => PublicKey;
