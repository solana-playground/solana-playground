import { Connection } from '@solana/web3.js';
export declare type Cluster = 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet' | 'custom';
export declare const resolveClusterFromConnection: (connection: Connection) => Cluster;
export declare const resolveClusterFromEndpoint: (endpoint: string) => Cluster;
