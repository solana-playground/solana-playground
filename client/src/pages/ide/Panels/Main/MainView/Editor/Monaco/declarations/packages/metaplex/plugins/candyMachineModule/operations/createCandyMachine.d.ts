import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { CandyGuardsSettings, DefaultCandyGuardSettings } from '../guards';
import { CandyMachine, CandyMachineConfigLineSettings, CandyMachineHiddenSettings } from '../models';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
import { BigNumber, Creator, Operation, OperationHandler, PublicKey, Signer } from '../../../types';
import { Metaplex } from '../../../Metaplex';
declare const Key: "CreateCandyMachineOperation";
/**
 * Creates a brand new Candy Machine with the provided settings.
 *
 * Unless the `withoutCandyGuard` option is set to `true`, a
 * Candy Guard will be created with the given guards and
 * immediately linked to the Candy Machine.
 *
 * ```ts
 *  const { candyMachine } = await metaplex
 *    .candyMachines()
 *    .create({
 *      itemsAvailable: toBigNumber(5000),
 *      sellerFeeBasisPoints: 333, // 3.33%
 *      collection: {
 *        address: collectionNft.address,
 *        updateAuthority: collectionUpdateAuthority,
 *      },
 *    });
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const createCandyMachineOperation: typeof _createCandyMachineOperation;
declare function _createCandyMachineOperation<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(input: CreateCandyMachineInput<T>): CreateCandyMachineOperation<T>;
declare namespace _createCandyMachineOperation {
    var key: "CreateCandyMachineOperation";
}
/**
 * @group Operations
 * @category Types
 */
export declare type CreateCandyMachineOperation<T extends CandyGuardsSettings = DefaultCandyGuardSettings> = Operation<typeof Key, CreateCandyMachineInput<T>, CreateCandyMachineOutput<T>>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type CreateCandyMachineInput<T extends CandyGuardsSettings = DefaultCandyGuardSettings> = {
    /**
     * The Candy Machine to create as a Signer.
     * This expects a brand new Keypair with no associated account.
     *
     * @defaultValue `Keypair.generate()`
     */
    candyMachine?: Signer;
    /**
     * Refers to the authority that is allowed to manage the Candy Machine.
     * This includes updating its data, authorities, inserting items, etc.
     *
     * By default, it is required as a Signer in order to create and wrap its
     * Candy Guard. However, when `withoutCandyGuard` is set to `true`, it
     * may be provided as a PublicKey instead.
     *
     * @defaultValue `metaplex.identity()`
     */
    authority?: PublicKey | Signer;
    /**
     * The Collection NFT that all NFTs minted from this Candy Machine should be part of.
     * This must include its address and the update authority as a Signer.
     *
     * @example
     * If you do not have a Collection NFT yet, you can create one using
     * the `create` method of the NFT module and setting `isCollection` to `true`.
     *
     * ```ts
     * const { nft } = await metaplex.
     *   .nfts()
     *   .create({ isCollection: true, name: 'My Collection', ... });
     * ```
     *
     * You can now use `nft.address` as the address of the collection and
     * provide the update authority as a signer, which by default, should
     * be `metaplex.identity()`.
     */
    collection: {
        address: PublicKey;
        updateAuthority: Signer;
    };
    /**
     * The royalties that should be set on minted NFTs in basis points.
     *
     * @example
     * ```ts
     * { sellerFeeBasisPoints: 250 } // For 2.5% royalties.
     * ```
     */
    sellerFeeBasisPoints: number;
    /**
     * The total number of items availble in the Candy Machine, minted or not.
     *
     * @example
     * ```ts
     * { itemsAvailable: toBigNumber(1000) } // For 1000 items.
     * ```
     */
    itemsAvailable: BigNumber;
    /**
     * Settings related to the Candy Machine's items.
     *
     * These can either be inserted manually within the Candy Machine or
     * they can be infered from a set of hidden settings.
     *
     * - If `type` is `hidden`, the Candy Machine is using hidden settings.
     * - If `type` is `configLines`, the Candy Machine is using config line settings.
     *
     * @defaultValue
     * Defaults to using `configLines` settings with:
     * - No prefixes.
     * - A length of 32 for the name.
     * - A length of 200 for the URI.
     * - Random mint ordering.
     *
     * ```ts
     * {
     *   itemSettings: {
     *     type: 'configLines',
     *     prefixName: '',
     *     nameLength: 32,
     *     prefixUri: '',
     *     uriLength: 200,
     *     isSequential: false,
     *   }
     * }
     * ```
     *
     * @see {@link CandyMachineHiddenSettings}
     * @see {@link CandyMachineConfigLineSettings}
     */
    itemSettings?: CandyMachineHiddenSettings | CandyMachineConfigLineSettings;
    /**
     * The symbol to use when minting NFTs (e.g. "MYPROJECT")
     *
     * This can be any string up to 10 bytes and can be made optional
     * by providing an empty string.
     *
     * @defaultValue `""`
     */
    symbol?: string;
    /**
     * The maximum number of editions that can be printed from the
     * minted NFTs.
     *
     * For most use cases, you'd want to set this to `0` to prevent
     * minted NFTs to be printed multiple times.
     *
     * Note that you cannot set this to `null` which means unlimited editions
     * are not supported by the Candy Machine program.
     *
     * @defaultValue `toBigNumber(0)`
     */
    maxEditionSupply?: BigNumber;
    /**
     * Whether the minted NFTs should be mutable or not.
     *
     * We recommend setting this to `true` unless you have a specific reason.
     * You can always make NFTs immutable in the future but you cannot make
     * immutable NFTs mutable ever again.
     *
     * @defaultValue `true`
     */
    isMutable?: boolean;
    /**
     * Array of creators that should be set on minted NFTs.
     *
     * @see {@link Creator}
     *
     * @defaultValue
     * Defaults to using the `authority` parameter as the only creator.
     *
     * ```ts
     * [{ address: authority, share: 100 }]
     * ```
     */
    creators?: Omit<Creator, 'verified'>[];
    /**
     * The settings of all guards we wish to activate.
     *
     * Any guard not provided or set to `null` will be disabled.
     *
     * This parameter is ignored if `withoutCandyGuard` is set to `true`.
     *
     * @defaultValue `{}`, i.e. no guards are activated.
     */
    guards?: Partial<T>;
    /**
     * This parameter allows us to create multiple minting groups that have their
     * own set of requirements — i.e. guards.
     *
     * When groups are provided, the `guards` parameter becomes a set of default
     * guards that will be applied to all groups. If a specific group enables
     * a guard that is also present in the default guards, the group's guard
     * will override the default guard.
     *
     * For each group, any guard not provided or set to `null` will be disabled.
     *
     * This parameter is ignored if `withoutCandyGuard` is set to `true`.
     *
     * @defaultValue `[]`, i.e. no groups are created.
     */
    groups?: {
        label: string;
        guards: Partial<T>;
    }[];
    /**
     * Whether to skip the part of this operation that creates a Candy Guard
     * for the new Candy Machine. When set to `true`, no Candy Guard will be
     * created for the Candy Machine.
     *
     * @defaultValue `false`
     */
    withoutCandyGuard?: boolean;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type CreateCandyMachineOutput<T extends CandyGuardsSettings = DefaultCandyGuardSettings> = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
    /** The Candy Machine that was created. */
    candyMachine: CandyMachine<T>;
    /** The created Candy Machine has a Signer. */
    candyMachineSigner: Signer;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const createCandyMachineOperationHandler: OperationHandler<CreateCandyMachineOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type CreateCandyMachineBuilderParams<T extends CandyGuardsSettings = DefaultCandyGuardSettings> = Omit<CreateCandyMachineInput<T>, 'confirmOptions'> & {
    /** A key to distinguish the instruction that creates the Candy Machine account. */
    createCandyMachineAccountInstructionKey?: string;
    /** A key to distinguish the instruction that initializes the Candy Machine account. */
    initializeCandyMachineInstructionKey?: string;
    /** A key to distinguish the instruction that wraps the Candy Machine in a Candy Guard. */
    wrapCandyGuardInstructionKey?: string;
};
/**
 * @group Transaction Builders
 * @category Contexts
 */
export declare type CreateCandyMachineBuilderContext = Omit<CreateCandyMachineOutput, 'response' | 'candyMachine'>;
/**

 * Creates a brand new Candy Machine with the provided settings.
 *
 * Unless the `withoutCandyGuard` option is set to `true`, a
 * Candy Guard will be created with the given guards and
 * immediately linked to the Candy Machine.
 *
 * ```ts
 *  const transactionBuilder = await metaplex
 *    .candyMachines()
 *    .builders()
 *    .create({
 *      itemsAvailable: toBigNumber(5000),
 *      sellerFeeBasisPoints: 333, // 3.33%
 *      collection: {
 *        address: collectionNft.address,
 *        updateAuthority: collectionUpdateAuthority,
 *      },
 *    });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const createCandyMachineBuilder: <T extends CandyGuardsSettings = DefaultCandyGuardSettings>(metaplex: Metaplex, params: CreateCandyMachineBuilderParams<T>, options?: TransactionBuilderOptions) => Promise<TransactionBuilder<CreateCandyMachineBuilderContext>>;
export {};
