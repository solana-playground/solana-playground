import { IdentityClient } from './IdentityClient';
import { MetaplexPlugin } from '../../types';
/** @group Plugins */
export declare const identityModule: () => MetaplexPlugin;
declare module '../../Metaplex' {
    interface Metaplex {
        identity(): IdentityClient;
    }
}
