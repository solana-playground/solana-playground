import { AuctionHouseClient } from './AuctionHouseClient';
import type { MetaplexPlugin, Program } from '../../types';
/** @group Plugins */
export declare const auctionHouseModule: () => MetaplexPlugin;
declare module '../../Metaplex' {
    interface Metaplex {
        auctionHouse(): AuctionHouseClient;
    }
}
declare module '../programModule/ProgramClient' {
    interface ProgramClient {
        getAuctionHouse(programs?: Program[]): Program;
    }
}
