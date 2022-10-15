import { PublicKey, Transaction } from '@solana/web3.js';
import { IdentityDriver } from '../identityModule';
export declare type WalletAdapter = {
    publicKey: PublicKey | null;
    signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
    signTransaction?: (transaction: Transaction) => Promise<Transaction>;
    signAllTransactions?: (transactions: Transaction[]) => Promise<Transaction[]>;
};
export declare class WalletAdapterIdentityDriver implements IdentityDriver {
    readonly walletAdapter: WalletAdapter;
    constructor(walletAdapter: WalletAdapter);
    get publicKey(): PublicKey;
    signMessage(message: Uint8Array): Promise<Uint8Array>;
    signTransaction(transaction: Transaction): Promise<Transaction>;
    signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
}
