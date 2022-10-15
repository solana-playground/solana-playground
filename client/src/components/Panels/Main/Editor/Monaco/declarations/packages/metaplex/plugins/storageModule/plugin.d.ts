import { StorageClient } from './StorageClient';
import { MetaplexPlugin } from '../../types';
/** @group Plugins */
export declare const storageModule: () => MetaplexPlugin;
declare module '../../Metaplex' {
    interface Metaplex {
        storage(): StorageClient;
    }
}
