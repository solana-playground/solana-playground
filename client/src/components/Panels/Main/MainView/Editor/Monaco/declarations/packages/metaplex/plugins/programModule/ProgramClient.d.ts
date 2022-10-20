import { PublicKey } from '@solana/web3.js';
import type { Metaplex } from '../../Metaplex';
import { Program, Cluster } from '../../types';
import { GpaBuilder } from '../../utils';
/**
 * @group Modules
 */
export declare class ProgramClient {
    protected readonly metaplex: Metaplex;
    protected programs: Program[];
    constructor(metaplex: Metaplex);
    register(program: Program): void;
    all(overrides?: Program[]): Program[];
    allForCluster(cluster: Cluster, overrides?: Program[]): Program[];
    allForCurrentCluster(overrides?: Program[]): Program[];
    get<T extends Program = Program>(nameOrAddress: string | PublicKey, overrides?: Program[]): T;
    getGpaBuilder<T extends GpaBuilder>(nameOrAddress: string | PublicKey, overrides?: Program[]): T;
}
