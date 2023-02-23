/// <reference types="node" />
import { Buffer } from 'buffer';
import { AccountMeta } from '@solana/web3.js';
import { CandyGuardManifest, CandyGuardsMintSettings, CandyGuardsRouteSettings, CandyGuardsSettings, DefaultCandyGuardRouteSettings, DefaultCandyGuardSettings } from './guards';
import { CandyGuard } from './models';
import { CandyGuardProgram } from './programs';
import { Option } from '../../utils';
import { Program, PublicKey, Signer } from '../../types';
import type { Metaplex } from '../../Metaplex';
/**
 * This client enables us to register custom guards from
 * custom Candy Guard programs and interact with them.
 *
 * @see {@link CandyGuardClient}
 * @group Module
 */
export declare class CandyMachineGuardsClient {
    protected readonly metaplex: Metaplex;
    readonly guards: CandyGuardManifest<any, any, any>[];
    constructor(metaplex: Metaplex);
    /** Registers one or many guards by providing their manifest. */
    register(...guard: CandyGuardManifest<any, any, any>[]): void;
    /** Gets the manifest of a guard using its name. */
    get(name: string): CandyGuardManifest<any, any, any>;
    /** Gets all registered guard manifests. */
    all(): CandyGuardManifest<any, any, any>[];
    /**
     * Gets all guard manifests for a registered Candy Guard program.
     *
     * It fails if the manifest of any guard expected by the program
     * is not registered. Manifests are returned in the order in which
     * they are defined on the `availableGuards` property of the program.
     */
    forProgram(program?: string | PublicKey | CandyGuardProgram): CandyGuardManifest<any, any, any>[];
    /**
     * Gets all guard manifests for the registered Candy Guard program.
     *
     * @see {@link CandyMachineGuardsClient.forProgram}
     */
    forCandyGuardProgram(programs?: Program[]): CandyGuardManifest<any, any, any>[];
    /** Serializes the settings of all guards and groups. */
    serializeSettings<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(guards: Partial<T>, groups?: {
        label: string;
        guards: Partial<T>;
    }[], programs?: Program[]): Buffer;
    /** Deserializes the settings of all guards and groups. */
    deserializeSettings<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(buffer: Buffer, program?: string | PublicKey | CandyGuardProgram): {
        guards: T;
        groups: {
            label: string;
            guards: T;
        }[];
    };
    /**
     * Resolves the set of settings that should be used when minting.
     *
     * If no group exists, the `guards` settings will be used.
     * Otherwise, the `guards` settings will act as default settings and
     * the settings of the selected group will override them.
     */
    resolveGroupSettings<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(guards: T, groups: {
        label: string;
        guards: T;
    }[] | undefined, groupLabel: Option<string>): T;
    /**
     * Parses the arguments and remaining accounts of
     * all relevant guards for the mint instruction.
     */
    parseMintSettings<Settings extends CandyGuardsSettings = DefaultCandyGuardSettings, MintSettings extends CandyGuardsMintSettings = {}>(candyMachine: PublicKey, candyGuard: CandyGuard<Settings>, payer: Signer, guardMintSettings: Partial<MintSettings>, groupLabel: Option<string>, programs?: Program[]): {
        arguments: Buffer;
        accountMetas: AccountMeta[];
        signers: Signer[];
    };
    /**
     * Parses the arguments and remaining accounts of
     * the requested guard for the route instruction.
     */
    parseRouteSettings<Guard extends keyof RouteSettings & string, Settings extends CandyGuardsSettings = DefaultCandyGuardSettings, RouteSettings extends CandyGuardsRouteSettings = DefaultCandyGuardRouteSettings>(candyMachine: PublicKey, candyGuard: CandyGuard<Settings>, payer: Signer, guard: Guard, routeSettings: RouteSettings[Guard], groupLabel: Option<string>, programs?: Program[]): {
        arguments: Buffer;
        accountMetas: AccountMeta[];
        signers: Signer[];
    };
}
