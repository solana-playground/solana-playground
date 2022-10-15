import type { default as NodeBundlr, WebBundlr } from '@bundlr-network/client';
import { Connection, PublicKey, SendOptions, Signer as Web3Signer, Transaction, TransactionSignature } from '@solana/web3.js';
import { MetaplexFile, StorageDriver } from '../storageModule';
import { Metaplex } from '../../Metaplex';
import { Amount, IdentitySigner, KeypairSigner, Signer } from '../../types';
export declare type BundlrOptions = {
    address?: string;
    timeout?: number;
    providerUrl?: string;
    priceMultiplier?: number;
    identity?: Signer;
};
export declare type BundlrWalletAdapter = {
    publicKey: PublicKey | null;
    signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
    signTransaction?: (transaction: Transaction) => Promise<Transaction>;
    signAllTransactions?: (transactions: Transaction[]) => Promise<Transaction[]>;
    sendTransaction: (transaction: Transaction, connection: Connection, options?: SendOptions & {
        signers?: Web3Signer[];
    }) => Promise<TransactionSignature>;
};
export declare class BundlrStorageDriver implements StorageDriver {
    protected _metaplex: Metaplex;
    protected _bundlr: WebBundlr | NodeBundlr | null;
    protected _options: BundlrOptions;
    constructor(metaplex: Metaplex, options?: BundlrOptions);
    getUploadPrice(bytes: number): Promise<Amount>;
    upload(file: MetaplexFile): Promise<string>;
    uploadAll(files: MetaplexFile[]): Promise<string[]>;
    getBalance(): Promise<Amount>;
    fund(amount: Amount, skipBalanceCheck?: boolean): Promise<void>;
    withdrawAll(): Promise<void>;
    withdraw(amount: Amount): Promise<void>;
    bundlr(): Promise<WebBundlr | NodeBundlr>;
    initBundlr(): Promise<WebBundlr | NodeBundlr>;
    initNodeBundlr(address: string, currency: string, keypair: KeypairSigner, options: any): NodeBundlr;
    initWebBundlr(address: string, currency: string, identity: IdentitySigner, options: any): Promise<WebBundlr>;
}
export declare const isBundlrStorageDriver: (storageDriver: StorageDriver) => storageDriver is BundlrStorageDriver;
