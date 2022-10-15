import { PublicKey, Transaction } from '@solana/web3.js';
import { IdentityDriver } from './IdentityDriver';
import { HasDriver, IdentitySigner, KeypairSigner, Signer } from '../../types';
/**
 * @group Modules
 */
export declare class IdentityClient implements HasDriver<IdentityDriver>, IdentitySigner {
    private _driver;
    driver(): IdentityDriver;
    setDriver(newDriver: IdentityDriver): void;
    get publicKey(): PublicKey;
    get secretKey(): Uint8Array | undefined;
    signMessage(message: Uint8Array): Promise<Uint8Array>;
    signTransaction(transaction: Transaction): Promise<Transaction>;
    signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
    verifyMessage(message: Uint8Array, signature: Uint8Array): boolean;
    equals(that: Signer | PublicKey): boolean;
    hasSecretKey(): this is KeypairSigner;
}
