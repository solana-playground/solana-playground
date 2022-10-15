import { RpcClient } from './RpcClient';
import { MetaplexPlugin } from '../../types';
/** @group Plugins */
export declare const rpcModule: () => MetaplexPlugin;
declare module '../../Metaplex' {
    interface Metaplex {
        rpc(): RpcClient;
    }
}
