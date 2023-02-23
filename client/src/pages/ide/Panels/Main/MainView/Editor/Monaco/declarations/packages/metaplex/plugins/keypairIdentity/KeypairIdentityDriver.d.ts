import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { IdentityDriver } from '../identityModule';
import { KeypairSigner } from '../../types';
export declare class KeypairIdentityDriver implements IdentityDriver, KeypairSigner {
    readonly keypair: Keypair;
    readonly publicKey: PublicKey;
    readonly secretKey: Uint8Array;
    constructor(keypair: Keypair);
    signMessage(message: Uint8Array): Promise<Uint8Array>;
    signTransaction(transaction: Transaction): Promise<Transaction>;
    signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
}
