import { ProgramClient } from './ProgramClient';
import { MetaplexPlugin } from '../../types';
/** @group Plugins */
export declare const programModule: () => MetaplexPlugin;
declare module '../../Metaplex' {
    interface Metaplex {
        programs(): ProgramClient;
    }
}
