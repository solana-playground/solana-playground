import { DerivedIdentityClient } from './DerivedIdentityClient';
import { MetaplexPlugin } from '../../types';
/** @group Plugins */
export declare const derivedIdentity: () => MetaplexPlugin;
declare module '../../Metaplex' {
    interface Metaplex {
        derivedIdentity(): DerivedIdentityClient;
    }
}
