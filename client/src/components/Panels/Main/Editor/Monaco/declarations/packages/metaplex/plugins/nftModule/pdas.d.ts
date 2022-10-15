import { PublicKey } from '@solana/web3.js';
import { BigNumber, Pda } from '../../types';
/**
 * @group Pdas
 * @deprecated Please use `metaplex.nfts().pdas().metadata(...)` instead.
 */
export declare const findMetadataPda: (mint: PublicKey, programId?: PublicKey) => Pda;
/**
 * @group Pdas
 * @deprecated Please use `metaplex.nfts().pdas().masterEdition(...)` instead.
 */
export declare const findMasterEditionV2Pda: (mint: PublicKey, programId?: PublicKey) => Pda;
/**
 * @group Pdas
 * @deprecated Please use `metaplex.nfts().pdas().edition(...)` instead.
 */
export declare const findEditionPda: (mint: PublicKey, programId?: PublicKey) => Pda;
/**
 * @group Pdas
 * @deprecated Please use `metaplex.nfts().pdas().editionMarker(...)` instead.
 */
export declare const findEditionMarkerPda: (mint: PublicKey, edition: BigNumber, programId?: PublicKey) => Pda;
/**
 * @group Pdas
 * @deprecated Please use `metaplex.nfts().pdas().collectionAuthorityRecord(...)` instead.
 */
export declare const findCollectionAuthorityRecordPda: (mint: PublicKey, collectionAuthority: PublicKey, programId?: PublicKey) => Pda;
/**
 * @group Pdas
 * @deprecated Please use `metaplex.nfts().pdas().useAuthorityRecord(...)` instead.
 */
export declare const findUseAuthorityRecordPda: (mint: PublicKey, useAuthority: PublicKey, programId?: PublicKey) => Pda;
/**
 * @group Pdas
 * @deprecated Please use `metaplex.nfts().pdas().burner(...)` instead.
 */
export declare const findProgramAsBurnerPda: (programId?: PublicKey) => Pda;
