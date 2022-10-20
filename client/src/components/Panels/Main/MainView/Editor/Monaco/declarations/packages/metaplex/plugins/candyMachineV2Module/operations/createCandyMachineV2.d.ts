import { Creator } from '@metaplex-foundation/mpl-candy-machine';
import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { CandyMachineV2, CandyMachineV2Configs } from '../models';
import { Option, RequiredKeys, TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
import { Operation, OperationHandler, Signer } from '../../../types';
import { Metaplex } from '../../../Metaplex';
declare const Key: "CreateCandyMachineV2Operation";
/**
 * Creates a brand new Candy Machine.
 *
 * ```ts
 * const { candyMachine } = await metaplex
 *   .candyMachinesV2()
 *   .create({
 *     sellerFeeBasisPoints: 500, // 5% royalties
 *     price: sol(1.3), // 1.3 SOL
 *     itemsAvailable: toBigNumber(1000), // 1000 items available
 *   };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const createCandyMachineV2Operation: import("../../../types").OperationConstructor<CreateCandyMachineV2Operation, "CreateCandyMachineV2Operation", CreateCandyMachineV2Input, CreateCandyMachineV2Output>;
/**
 * @group Operations
 * @category Types
 */
export declare type CreateCandyMachineV2Operation = Operation<typeof Key, CreateCandyMachineV2Input, CreateCandyMachineV2Output>;
export declare type CreateCandyMachineV2InputWithoutConfigs = {
    /**
     * The Candy Machine to create as a Signer.
     * This expects a brand new Keypair with no associated account.
     *
     * @defaultValue `Keypair.generate()`
     */
    candyMachine?: Signer;
    /**
     * The authority that will be allowed to update the Candy Machine.
     * Upon creation, passing the authority's public key is enough to set it.
     * However, when also passing a `collection` to this operation,
     * this authority will need to be passed as a Signer so the relevant
     * instruction can be signed.
     *
     * @defaultValue `metaplex.identity()`
     */
    authority?: Signer | PublicKey;
    /**
     * The mint address of the Collection NFT that all NFTs minted from
     * this Candy Machine should be part of.
     * When provided, the `authority` parameter will need to be passed as a `Signer`.
     * When `null`, minted NFTs won't be part of a collection.
     *
     * @defaultValue `null`
     */
    collection?: Option<PublicKey>;
};
/**
 * @group Operations
 * @category Inputs
 */
export declare type CreateCandyMachineV2Input = CreateCandyMachineV2InputWithoutConfigs & RequiredKeys<Partial<CandyMachineV2Configs>, 'price' | 'sellerFeeBasisPoints' | 'itemsAvailable'>;
/**
 * @group Operations
 * @category Outputs
 */
export declare type CreateCandyMachineV2Output = {
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
    /** The created Candy Machine. */
    candyMachine: CandyMachineV2;
    /** The create Candy Machine's account as a Signer. */
    candyMachineSigner: Signer;
    /** The created Candy Machine's wallet. */
    wallet: PublicKey;
    /** The created Candy Machine's authority. */
    authority: PublicKey;
    /** The created Candy Machine's creators. */
    creators: Creator[];
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const createCandyMachineV2OperationHandler: OperationHandler<CreateCandyMachineV2Operation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type CreateCandyMachineV2BuilderParams = Omit<CreateCandyMachineV2Input, 'confirmOptions'> & {
    /** A key to distinguish the instruction that creates the account. */
    createAccountInstructionKey?: string;
    /** A key to distinguish the instruction that initializes the Candy Machine. */
    initializeCandyMachineInstructionKey?: string;
    /** A key to distinguish the instruction that sets the collection. */
    setCollectionInstructionKey?: string;
};
/**
 * @group Transaction Builders
 * @category Contexts
 */
export declare type CreateCandyMachineV2BuilderContext = Omit<CreateCandyMachineV2Output, 'response' | 'candyMachine'>;
/**
 * Creates a brand new Candy Machine.
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .candyMachinesV2()
 *   .builders()
 *   .create({
 *     sellerFeeBasisPoints: 500, // 5% royalties
 *     price: sol(1.3), // 1.3 SOL
 *     itemsAvailable: toBigNumber(1000), // 1000 items available
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const createCandyMachineV2Builder: (metaplex: Metaplex, params: CreateCandyMachineV2BuilderParams, options?: TransactionBuilderOptions) => Promise<TransactionBuilder<CreateCandyMachineV2BuilderContext>>;
export {};
