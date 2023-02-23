import { PublicKey, Transaction } from '@solana/web3.js';
import { IdentityDriver } from '../identityModule';
export declare class GuestIdentityDriver implements IdentityDriver {
    readonly publicKey: PublicKey;
    constructor(publicKey?: PublicKey);
    signMessage(): Promise<Uint8Array>;
    signTransaction(): Promise<Transaction>;
    signAllTransactions(): Promise<Transaction[]>;
}
