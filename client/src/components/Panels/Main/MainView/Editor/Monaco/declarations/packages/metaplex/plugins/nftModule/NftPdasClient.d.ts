import type { Metaplex } from '../../Metaplex';
import { BigNumber, Pda, Program, PublicKey } from '../../types';
/**
 * This client allows you to build PDAs related to the NFT module.
 *
 * @see {@link NftClient}
 * @group Module Pdas
 */
export declare class NftPdasClient {
    protected readonly metaplex: Metaplex;
    constructor(metaplex: Metaplex);
    /** Finds the Metadata PDA of a given mint address. */
    metadata({ mint, programs }: MintAddressPdaInput): Pda;
    /** Finds the Master Edition PDA of a given mint address. */
    masterEdition({ mint, programs }: MintAddressPdaInput): Pda;
    /** Finds the Edition PDA of a given mint address. */
    edition(input: MintAddressPdaInput): Pda;
    /** Finds the Edition Marker PDA of a given edition number. */
    editionMarker({ mint, edition, programs, }: {
        /** The address of the mint account of the edition NFT. */
        mint: PublicKey;
        /** The edition number of the NFT. */
        edition: BigNumber;
        /** An optional set of programs that override the registered ones. */
        programs?: Program[];
    }): Pda;
    /** Finds the collection authority PDA for a given NFT and authority. */
    collectionAuthorityRecord({ mint, collectionAuthority, programs, }: {
        /** The address of the NFT's mint account. */
        mint: PublicKey;
        /** The address of the collection authority. */
        collectionAuthority: PublicKey;
        /** An optional set of programs that override the registered ones. */
        programs?: Program[];
    }): Pda;
    /** Finds the use authority PDA for a given NFT and user. */
    useAuthorityRecord({ mint, useAuthority, programs, }: {
        /** The address of the NFT's mint account. */
        mint: PublicKey;
        /** The address of the use authority. */
        useAuthority: PublicKey;
        /** An optional set of programs that override the registered ones. */
        programs?: Program[];
    }): Pda;
    /** Finds the burner PDA of the Token Metadata program. */
    burner({ programs, }: {
        /** An optional set of programs that override the registered ones. */
        programs?: Program[];
    }): Pda;
    private programId;
}
declare type MintAddressPdaInput = {
    /** The address of the mint account. */
    mint: PublicKey;
    /** An optional set of programs that override the registered ones. */
    programs?: Program[];
};
export {};
