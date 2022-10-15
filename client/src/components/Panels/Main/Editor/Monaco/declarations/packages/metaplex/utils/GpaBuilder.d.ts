/// <reference types="node" />
import { Buffer } from 'buffer';
import { GetProgramAccountsConfig, GetProgramAccountsFilter, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { GmaBuilder, GmaBuilderOptions } from './GmaBuilder';
import { Metaplex } from '../Metaplex';
import { UnparsedAccount } from '../types';
export declare type GpaSortCallback = (a: UnparsedAccount, b: UnparsedAccount) => number;
export declare class GpaBuilder {
    /** The connection instance to use when fetching accounts. */
    protected readonly metaplex: Metaplex;
    /** The public key of the program we want to retrieve accounts from. */
    protected readonly programId: PublicKey;
    /** The configs to use when fetching program accounts. */
    protected config: GetProgramAccountsConfig;
    /** When provided, reorder accounts using this callback. */
    protected sortCallback?: GpaSortCallback;
    constructor(metaplex: Metaplex, programId: PublicKey);
    mergeConfig(config: GetProgramAccountsConfig): this;
    slice(offset: number, length: number): this;
    withoutData(): this;
    addFilter(...filters: GetProgramAccountsFilter[]): this;
    where(offset: number, bytes: string | Buffer | PublicKey | BN | number): this;
    whereSize(dataSize: number): this;
    sortUsing(callback: GpaSortCallback): this;
    get(): Promise<UnparsedAccount[]>;
    getAndMap<T>(callback: (account: UnparsedAccount) => T): Promise<T[]>;
    getPublicKeys(): Promise<PublicKey[]>;
    getDataAsPublicKeys(): Promise<PublicKey[]>;
    getMultipleAccounts(callback?: (account: UnparsedAccount) => PublicKey, options?: GmaBuilderOptions): Promise<GmaBuilder>;
}
