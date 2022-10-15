import { PublicKey } from '@solana/web3.js';
import { Pda } from '../../types';
/** @group Pdas */
export declare const findCandyMachineV2CreatorPda: (candyMachine: PublicKey, programId?: PublicKey) => Pda;
/** @group Pdas */
export declare const findCandyMachineV2CollectionPda: (candyMachine: PublicKey, programId?: PublicKey) => Pda;
