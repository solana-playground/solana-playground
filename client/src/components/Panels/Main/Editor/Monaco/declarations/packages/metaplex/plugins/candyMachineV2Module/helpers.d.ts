/// <reference types="node" />
import type { PublicKey } from '@solana/web3.js';
import { CandyMachineData } from '@metaplex-foundation/mpl-candy-machine';
import { CandyMachineV2Item } from './models';
import { BigNumber } from '../../types';
export declare function countCandyMachineV2Items(rawData: Buffer): BigNumber;
export declare function parseCandyMachineV2Items(rawData: Buffer): CandyMachineV2Item[];
export declare function getCandyMachineV2AccountSizeFromData(data: CandyMachineData): number;
export declare const getCandyMachineV2UuidFromAddress: (candyMachineAddress: PublicKey) => string;
