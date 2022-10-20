import { TokenClient } from './TokenClient';
import type { MetaplexPlugin, Program } from '../../types';
/**
 * @group Plugins
 */
/** @group Plugins */
export declare const tokenModule: () => MetaplexPlugin;
declare module '../../Metaplex' {
    interface Metaplex {
        tokens(): TokenClient;
    }
}
declare module '../programModule/ProgramClient' {
    interface ProgramClient {
        getToken(programs?: Program[]): Program;
        getAssociatedToken(programs?: Program[]): Program;
    }
}
