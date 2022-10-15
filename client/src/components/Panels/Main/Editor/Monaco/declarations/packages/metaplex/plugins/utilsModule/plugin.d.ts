import { UtilsClient } from './UtilsClient';
import { MetaplexPlugin } from '../../types';
/** @group Plugins */
export declare const utilsModule: () => MetaplexPlugin;
declare module '../../Metaplex' {
    interface Metaplex {
        utils(): UtilsClient;
    }
}
