/// <reference types="node" />
import { Buffer } from 'buffer';
import { PublicKey } from '@solana/web3.js';
import { SolAmount } from './Amount';
import { SolitaType } from './Serializer';
export declare type AccountInfo = {
    readonly executable: boolean;
    readonly owner: PublicKey;
    readonly lamports: SolAmount;
    readonly rentEpoch?: number;
};
export declare type Account<T> = AccountInfo & {
    readonly publicKey: PublicKey;
    readonly data: T;
};
export declare type MaybeAccount<T> = (Account<T> & {
    readonly exists: true;
}) | {
    readonly publicKey: PublicKey;
    readonly exists: false;
};
export declare type UnparsedAccount = Account<Buffer>;
export declare type UnparsedMaybeAccount = MaybeAccount<Buffer>;
export declare type AccountParsingFunction<T> = {
    (unparsedAccount: UnparsedAccount): Account<T>;
    (unparsedAccount: UnparsedMaybeAccount): MaybeAccount<T>;
};
export declare type AccountParsingAndAssertingFunction<T> = (unparsedAccount: UnparsedAccount | UnparsedMaybeAccount, solution?: string) => Account<T>;
export declare function getAccountParsingFunction<T>(parser: SolitaType<T>): AccountParsingFunction<T>;
export declare function getAccountParsingAndAssertingFunction<T>(parser: SolitaType<T>): AccountParsingAndAssertingFunction<T>;
export declare function assertAccountExists<T>(account: MaybeAccount<T>, name?: string, solution?: string): asserts account is Account<T> & {
    exists: true;
};
export declare const toAccountInfo: (account: UnparsedAccount) => AccountInfo;
