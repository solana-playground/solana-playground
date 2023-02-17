import { Commitment, PublicKey } from '@solana/web3.js';
import { Metaplex } from '../Metaplex';
import { UnparsedMaybeAccount } from '../types';
export declare type GmaBuilderOptions = {
    chunkSize?: number;
    /** The level of commitment desired when querying the blockchain. */
    commitment?: Commitment;
};
export declare class GmaBuilder {
    protected readonly metaplex: Metaplex;
    protected readonly publicKeys: PublicKey[];
    protected readonly commitment?: Commitment;
    protected chunkSize: number;
    constructor(metaplex: Metaplex, publicKeys: PublicKey[], options?: GmaBuilderOptions);
    static make(metaplex: Metaplex, publicKeys: PublicKey[], options?: GmaBuilderOptions): GmaBuilder;
    chunkBy(n: number): this;
    addPublicKeys(publicKeys: PublicKey[]): this;
    getPublicKeys(): PublicKey[];
    getUniquePublicKeys(): PublicKey[];
    getFirst(n?: number): Promise<UnparsedMaybeAccount[]>;
    getLast(n?: number): Promise<UnparsedMaybeAccount[]>;
    getBetween(start: number, end: number): Promise<UnparsedMaybeAccount[]>;
    getPage(page: number, perPage: number): Promise<UnparsedMaybeAccount[]>;
    get(): Promise<UnparsedMaybeAccount[]>;
    getAndMap<T>(callback: (account: UnparsedMaybeAccount) => T): Promise<T[]>;
    protected getChunks(publicKeys: PublicKey[]): Promise<UnparsedMaybeAccount[]>;
    protected getChunk(publicKeys: PublicKey[]): Promise<UnparsedMaybeAccount[]>;
    protected boundNumber(n: number): number;
    protected boundIndex(index: number): number;
}
