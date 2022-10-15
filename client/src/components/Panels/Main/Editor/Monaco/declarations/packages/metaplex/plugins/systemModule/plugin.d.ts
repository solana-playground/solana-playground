import { SystemClient } from './SystemClient';
import type { MetaplexPlugin, Program } from '../../types';
/**
 * @group Plugins
 */
/** @group Plugins */
export declare const systemModule: () => MetaplexPlugin;
declare module '../../Metaplex' {
    interface Metaplex {
        system(): SystemClient;
    }
}
declare module '../programModule/ProgramClient' {
    interface ProgramClient {
        getSystem(programs?: Program[]): Program;
    }
}
