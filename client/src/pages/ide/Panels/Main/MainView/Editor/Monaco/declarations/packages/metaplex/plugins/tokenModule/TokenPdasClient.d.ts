import type { Metaplex } from '../../Metaplex';
import { Pda, Program, PublicKey } from '../../types';
/**
 * This client allows you to build PDAs related to the Token module.
 *
 * @see {@link TokenClient}
 * @group Module Pdas
 */
export declare class TokenPdasClient {
    protected readonly metaplex: Metaplex;
    constructor(metaplex: Metaplex);
    /** Finds the address of the Associated Token Account. */
    associatedTokenAccount({ mint, owner, programs, }: {
        /** The address of the mint account. */
        mint: PublicKey;
        /** The address of the owner account. */
        owner: PublicKey;
        /** An optional set of programs that override the registered ones. */
        programs?: Program[];
    }): Pda;
}
