/// <reference types="node" />
import { Buffer } from 'buffer';
import { PublicKey, PublicKeyInitData } from '@solana/web3.js';
export declare class Pda extends PublicKey {
    /** The bump used to generate the PDA. */
    readonly bump: number;
    constructor(value: PublicKeyInitData, bump: number);
    static find(programId: PublicKey, seeds: Array<Buffer | Uint8Array>): Pda;
}
