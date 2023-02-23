import { CandyMachineData } from '@metaplex-foundation/mpl-candy-machine-core';
import { CandyGuardsSettings, DefaultCandyGuardSettings } from '../guards';
import { CandyMachineItem } from './CandyMachineItem';
import { CandyGuard } from './CandyGuard';
import { AccountInfo, BigNumber, Creator, FeatureFlags, Model, PublicKey, UnparsedAccount } from '../../../types';
import { Option } from '../../../utils';
/**
 * This model contains all the relevant information about a Candy Machine.
 * This includes its settings but also all of the items (a.k.a. config lines)
 * loaded inside the Candy Machine along with some statistics about the items.
 *
 * @group Models
 */
export declare type CandyMachine<T extends CandyGuardsSettings = DefaultCandyGuardSettings> = Model<'candyMachine'> & {
    /** The address of the Candy Machine account. */
    readonly address: PublicKey;
    /** Blockchain data of the Candy Machine account. */
    readonly accountInfo: AccountInfo;
    /**
     * Refers to the authority that is allowed to manage the Candy Machine.
     * This includes updating its data, authorities, inserting items, etc.
     */
    readonly authorityAddress: PublicKey;
    /**
     * Refers to the only authority that is allowed to mint from
     * this Candy Machine. This will refer to the address of the Candy
     * Guard associated with the Candy Machine if any.
     */
    readonly mintAuthorityAddress: PublicKey;
    /**
     * The mint address of the collection NFT that should be associated with
     * minted NFTs. When `null`, it means NFTs will not be part of a
     * collection when minted.
     */
    readonly collectionMintAddress: PublicKey;
    /**
     * The symbol to use when minting NFTs (e.g. "MYPROJECT")
     *
     * This can be any string up to 10 bytes and can be made optional
     * by providing an empty string.
     */
    readonly symbol: string;
    /**
     * The royalties that should be set on minted NFTs in basis points
     * (i.e. 250 is 2.5%).
     */
    readonly sellerFeeBasisPoints: number;
    /**
     * Whether the minted NFTs should be mutable or not.
     *
     * We recommend setting this to `true` unless you have a specific reason.
     * You can always make NFTs immutable in the future but you cannot make
     * immutable NFTs mutable ever again.
     */
    readonly isMutable: boolean;
    /**
     * The maximum number of editions that can be printed from the
     * minted NFTs.
     *
     * For most use cases, you'd want to set this to `0` to prevent
     * minted NFTs to be printed multiple times.
     *
     * Note that you cannot set this to `null` which means unlimited editions
     * are not supported by the Candy Machine program.
     */
    readonly maxEditionSupply: BigNumber;
    /**
     * Array of creators that should be set on minted NFTs.
     * creators can only verify NFTs after they have been minted.
     * Thus, all the provided creators will have `verified` set to `false`.
     *
     * @see {@link Creator}
     */
    readonly creators: Omit<Creator, 'verified'>[];
    /**
     * The parsed items that are loaded in the Candy Machine.
     *
     * If the Candy Machine is using hidden settings,
     * this will be an empty array.
     */
    readonly items: CandyMachineItem[];
    /**
     * The total number of items availble in the Candy Machine, minted or not.
     */
    readonly itemsAvailable: BigNumber;
    /**
     * The number of items that have been minted on this Candy Machine so far.
     */
    readonly itemsMinted: BigNumber;
    /**
     * The number of remaining items in the Candy Machine that can still be minted.
     */
    readonly itemsRemaining: BigNumber;
    /**
     * The number of items that have been inserted in the Candy Machine by
     * its update authority. If this number if lower than the number of items
     * available, the Candy Machine is not ready and cannot be minted from.
     *
     * This field is irrelevant if the Candy Machine is using hidden settings.
     */
    readonly itemsLoaded: number;
    /**
     * Whether all items in the Candy Machine have been inserted by
     * its authority.
     *
     * This field is irrelevant if the Candy Machine is using hidden settings.
     */
    readonly isFullyLoaded: boolean;
    /**
     * Settings related to the Candy Machine's items.
     *
     * These can either be inserted manually within the Candy Machine or
     * they can be infered from a set of hidden settings.
     *
     * - If `type` is `hidden`, the Candy Machine is using hidden settings.
     * - If `type` is `configLines`, the Candy Machine is using config line settings.
     *
     * @see {@link CandyMachineHiddenSettings}
     * @see {@link CandyMachineConfigLineSettings}
     */
    readonly itemSettings: CandyMachineHiddenSettings | CandyMachineConfigLineSettings;
    /**
     * This array of booleans is used to keep track of which
     * new features have been enabled on the Candy Machine.
     */
    readonly featureFlags: FeatureFlags;
    /**
     * The Candy Guard associted with the Candy Machine if any.
     */
    readonly candyGuard: Option<CandyGuard<T>>;
};
/**
 * Settings that makes items in the Candy Machine hidden by
 * providing a single URI for all minted NFTs and the hash of a file that
 * maps mint number to actual NFT URIs.
 *
 * Hidden settings serve two purposes.
 * - First, it allows the creation of larger drops (20k+), since
 *   the JSON metadata URIs are not stored on-chain for each item.
 * - In turn, this also allows the creation of hide-and-reveal drops,
 *   where users discover which items they minted after the mint is complete.
 *
 * Once hidden settings are enabled, every minted NFT will have the same URI and the
 * name will be created by appending the mint number (e.g., “#45”) to the specified
 * name. The hash is expected to be a 32 character string corresponding to
 * the hash of a cache file that has the mapping between a mint number and the
 * actual metadata URI. This allows the order of the mint to be verified by
 * others after the mint is complete.
 *
 * Since the metadata URIs are not on-chain, it is possible to create very large
 * drops. The only caveat is that there is a need for an off-chain process to
 * update the metadata for each item. This is important otherwise all items
 * will have the same metadata.
 *
 * @group Models
 */
export declare type CandyMachineHiddenSettings = {
    /** Identifier used to distinguish the various types of item settings. */
    readonly type: 'hidden';
    /**
     * The base name for all minted NFTs.
     *
     * You can use the following variables in the name:
     * - `$ID$`: The index of the item (starting at 0).
     * - `$ID+1$`: The number of the item (starting at 1).
     */
    readonly name: string;
    /**
     * The URI shared by all minted NFTs.
     *
     * You can use the following variables in the URI:
     * - `$ID$`: The index of the item (starting at 0).
     * - `$ID+1$`: The number of the item (starting at 1).
     */
    readonly uri: string;
    /**
     * A 32-character hash. In most cases this is the hash of the
     * cache file with the mapping between mint numbers and metadata URIs
     * so that the order can be verified when the mint is complete.
     */
    readonly hash: number[];
};
/**
 * A set of settings that aim to reduce the size of the Candy Machine
 * whilst allowing items to be manually inserted for more flexibility.
 *
 * This introduces `name` and `uri` prefixes that will be used for each
 * item inserted.
 *
 * @example
 * For instance, say all inserted items will have the following structure,
 * where zeros represent the dynamic part of the name and URI:
 * - name: "My NFT Project #0000"
 * - uri: "https://arweave.net/00000000000000000000"
 *
 * Then we can use the following prefixes:
 * - prefixName: "My NFT Project #"
 * - prefixUri: "https://arweave.net/"
 *
 * And the following lengths:
 * - nameLength: 4 (assuming we'll never have more than 9999 items)
 * - uriLength: 20
 *
 * We could even go one step further and set the `nameLength` to zero by
 * relying on template variables in the name prefix:
 * - prefixName: "My NFT Project #$ID+1$"
 * - nameLength: 0
 *
 * Now, the program will automatically append the item number to the
 * name of each minted NFT.
 *
 * @group Models
 */
export declare type CandyMachineConfigLineSettings = {
    /** Identifier used to distinguish the various types of item settings. */
    readonly type: 'configLines';
    /**
     * The prefix of the name of each item.
     *
     * The following template variables can be used:
     * - `$ID$`: The index of the item (starting at 0).
     * - `$ID+1$`: The number of the item (starting at 1).
     */
    readonly prefixName: string;
    /**
     * The maximum length to use for the name of inserted items
     * excluding the length of the prefix.
     *
     * For instance, if the name prefix is "My NFT Project #" and we want to
     * add item numbers up to 9999, we would set this value to 4.
     */
    readonly nameLength: number;
    /**
     * The prefix of the URI of each item.
     *
     * The following template variables can be used:
     * - `$ID$`: The index of the item (starting at 0).
     * - `$ID+1$`: The number of the item (starting at 1).
     */
    readonly prefixUri: string;
    /**
     * The maximum length to use for the URI of inserted items
     * excluding the length of the prefix.
     *
     * For instance, if the URI prefix is "https://arweave.net/" and we assume
     * Arweave identifiers are 20 characters long max, we would set this value to 20.
     */
    readonly uriLength: number;
    /**
     * Indicates whether to use a sequential index generator or not.
     * When set to `true`, NFTs will be minted sequentially.
     * When set to `false`, NFTs will be minted in a random order.
     */
    readonly isSequential: boolean;
};
/** @group Model Helpers */
export declare const isCandyMachine: <T extends CandyGuardsSettings = DefaultCandyGuardSettings>(value: any) => value is CandyMachine<T>;
/** @group Model Helpers */
export declare function assertCandyMachine<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(value: any): asserts value is CandyMachine<T>;
/** @group Model Helpers */
export declare const toCandyMachine: <T extends CandyGuardsSettings = DefaultCandyGuardSettings>(account: UnparsedAccount, candyGuard?: Option<CandyGuard<T>>) => CandyMachine<T>;
export declare const toCandyMachineData: (candyMachine: Pick<CandyMachine, 'itemsAvailable' | 'symbol' | 'sellerFeeBasisPoints' | 'maxEditionSupply' | 'isMutable' | 'creators' | 'itemSettings'>) => CandyMachineData;
