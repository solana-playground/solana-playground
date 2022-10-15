import { PublicKey } from '@solana/web3.js';
import { MetaplexPlugin } from '../../types';
/** @group Plugins */
export declare const guestIdentity: (publicKey?: PublicKey | undefined) => MetaplexPlugin;
