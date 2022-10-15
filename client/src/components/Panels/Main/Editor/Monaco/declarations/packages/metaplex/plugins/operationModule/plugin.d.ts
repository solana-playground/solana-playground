import { OperationClient } from './OperationClient';
import { MetaplexPlugin } from '../../types';
/** @group Plugins */
export declare const operationModule: () => MetaplexPlugin;
declare module '../../Metaplex' {
    interface Metaplex {
        operations(): OperationClient;
    }
}
