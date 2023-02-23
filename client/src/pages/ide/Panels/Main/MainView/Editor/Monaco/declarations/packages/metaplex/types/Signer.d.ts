import { PublicKey, Transaction } from '@solana/web3.js';
export declare type Signer = KeypairSigner | IdentitySigner;
export declare type KeypairSigner = {
    publicKey: PublicKey;
    secretKey: Uint8Array;
};
export declare type IdentitySigner = {
    publicKey: PublicKey;
    signMessage(message: Uint8Array): Promise<Uint8Array>;
    signTransaction(transaction: Transaction): Promise<Transaction>;
    signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
};
export declare const isSigner: (input: any) => input is Signer;
export declare const isKeypairSigner: (input: any) => input is KeypairSigner;
export declare const isIdentitySigner: (input: any) => input is IdentitySigner;
export declare type SignerHistogram = {
    all: Signer[];
    keypairs: KeypairSigner[];
    identities: IdentitySigner[];
};
export declare const getSignerHistogram: (signers: Signer[]) => SignerHistogram;
