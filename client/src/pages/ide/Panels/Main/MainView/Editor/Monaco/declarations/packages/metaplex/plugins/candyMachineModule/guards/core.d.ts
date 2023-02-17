/// <reference types="node" />
import { Buffer } from 'buffer';
import { Metaplex, Program } from '../../../index';
import { PublicKey, Serializer, Signer } from '../../../types';
import { Option } from '../../../utils';
/**
 * When creating your own custom guards, you will need to register them
 * with the JS SDK by creating a `CandyGuardManifest` which lets the SDK
 * know how to interact with your guard.
 */
export declare type CandyGuardManifest<Settings extends object, MintSettings extends object = {}, RouteSettings extends object = {}> = {
    /**
     * The name of your guard. This should match the name provided in the
     * `availableGuards` array of your registered `CandyGuardProgram`.
     */
    name: string;
    /**
     * The total amount of bytes required to serialize your guard's settings.
     * Contratry to the usual Borsh serialization, this size is fixed and should
     * represent the maximum space required for your guard's settings.
     */
    settingsBytes: number;
    /**
     * The serializer used to serialize and deserialize your guard's settings.
     */
    settingsSerializer: Serializer<Settings>;
    /**
     * If your guard requires additional accounts or arguments to be passed
     * to the `mint` instruction, this function parses the predefined `mintSettings`
     * of your guards into the required arguments and remaining accounts.
     */
    mintSettingsParser?: (input: {
        /** The metaplex instance used to mint. */
        metaplex: Metaplex;
        /** The guard's settings. */
        settings: Settings;
        /** The optional mint settings. */
        mintSettings: Option<MintSettings>;
        /** The minting wallet as a Signer. */
        payer: Signer;
        /** The address of the Candy Machine we are minting from. */
        candyMachine: PublicKey;
        /** The address of the Candy Guard we are minting from. */
        candyGuard: PublicKey;
        /** An optional set of programs that override the registered ones. */
        programs: Program[];
    }) => {
        /** The serialized arguments to pass to the mint instruction. */
        arguments: Buffer;
        /** {@inheritDoc CandyGuardsRemainingAccount} */
        remainingAccounts: CandyGuardsRemainingAccount[];
    };
    /**
     * If your guard support the "route" instruction which allows you to execute
     * a custom instruction on the guard, this function parses the predefined
     * `routeSettings` of your guards into the required arguments and remaining accounts.
     */
    routeSettingsParser?: (input: {
        /** The metaplex instance used when calling the route instruction. */
        metaplex: Metaplex;
        /** The guard's settings. */
        settings: Settings;
        /** The route settings for that guard. */
        routeSettings: RouteSettings;
        /** The payer for the route instruction. */
        payer: Signer;
        /** The address of the Candy Machine we are routing from. */
        candyMachine: PublicKey;
        /** The address of the Candy Guard we are routing from. */
        candyGuard: PublicKey;
        /** An optional set of programs that override the registered ones. */
        programs: Program[];
    }) => {
        /** The serialized arguments to pass to the route instruction. */
        arguments: Buffer;
        /** {@inheritDoc CandyGuardsRemainingAccount} */
        remainingAccounts: CandyGuardsRemainingAccount[];
    };
};
/**
 * Sets expectations on Candy Guard settings which
 * uses the name of the guard as the key and, if enabled,
 * the settings of the guard as the value.
 */
export declare type CandyGuardsSettings = {
    [name: string]: Option<object>;
};
/**
 * Sets expectations on Candy Guard mint settings which
 * uses the name of the guard as the key and, if applicable,
 * the mint settings of the guard as the value.
 */
export declare type CandyGuardsMintSettings = {
    [name: string]: Option<object>;
};
/**
 * Sets expectations on Candy Guard route settings which
 * uses the name of the guard as the key and the route
 * settings of the guard as the value.
 */
export declare type CandyGuardsRouteSettings = {
    [name: string]: object;
};
/**
 * A remain account to push to the mint or route instruction.
 * When `isSigner` is true, the `address` attribute must be `Signer`
 * and it will be pushed to the `signers` array of the transaction.
 */
export declare type CandyGuardsRemainingAccount = {
    isSigner: false;
    address: PublicKey;
    isWritable: boolean;
} | {
    isSigner: true;
    address: Signer;
    isWritable: boolean;
};
