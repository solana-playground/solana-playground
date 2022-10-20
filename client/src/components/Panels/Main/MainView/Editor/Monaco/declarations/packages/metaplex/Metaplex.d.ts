import { Connection } from '@solana/web3.js';
import { MetaplexPlugin, Cluster } from './types';
export declare type MetaplexOptions = {
    cluster?: Cluster;
};
export declare class Metaplex {
    /** The connection object from Solana's SDK. */
    readonly connection: Connection;
    /** The cluster in which the connection endpoint belongs to. */
    readonly cluster: Cluster;
    constructor(connection: Connection, options?: MetaplexOptions);
    static make(connection: Connection, options?: MetaplexOptions): Metaplex;
    use(plugin: MetaplexPlugin): this;
}
