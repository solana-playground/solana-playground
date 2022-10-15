import { CandyMachinesV2Client } from './CandyMachinesV2Client';
import { MetaplexPlugin } from '../../types';
/** @group Plugins */
export declare const candyMachineV2Module: () => MetaplexPlugin;
declare module '../../Metaplex' {
    interface Metaplex {
        candyMachinesV2(): CandyMachinesV2Client;
    }
}
