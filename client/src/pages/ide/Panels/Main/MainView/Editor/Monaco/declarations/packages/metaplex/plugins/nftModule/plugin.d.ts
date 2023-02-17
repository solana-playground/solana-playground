import { NftClient } from './NftClient';
import { MetaplexPlugin, Program } from '../../types';
/** @group Plugins */
export declare const nftModule: () => MetaplexPlugin;
declare module '../../Metaplex' {
    interface Metaplex {
        nfts(): NftClient;
    }
}
declare module '../programModule/ProgramClient' {
    interface ProgramClient {
        getTokenMetadata(programs?: Program[]): Program;
    }
}
