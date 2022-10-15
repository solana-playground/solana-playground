import { SendAndConfirmTransactionResponse } from "../../rpcModule";
import {
  CandyGuardsMintSettings,
  CandyGuardsSettings,
  DefaultCandyGuardMintSettings,
  DefaultCandyGuardSettings,
} from "../guards";
import { CandyMachine } from "../models";
import {
  Option,
  TransactionBuilder,
  TransactionBuilderOptions,
} from "../../../utils";
import { Operation, OperationHandler, PublicKey, Signer } from "../../../types";
import { NftWithToken } from "../../nftModule";
import { Metaplex } from "../../../Metaplex";
declare const Key: "MintFromCandyMachineOperation";
/**
 * Mints the next NFT from a given candy machine.
 *
 * ```ts
 * const { nft } = await metaplex
 *   .candyMachines()
 *   .mint({
 *     candyMachine,
 *     collectionUpdateAuthority,
 *   };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const mintFromCandyMachineOperation: typeof _mintFromCandyMachineOperation;
declare function _mintFromCandyMachineOperation<
  Settings extends CandyGuardsSettings = DefaultCandyGuardSettings,
  MintSettings extends CandyGuardsMintSettings = DefaultCandyGuardMintSettings
>(
  input: MintFromCandyMachineInput<Settings, MintSettings>
): MintFromCandyMachineOperation<Settings, MintSettings>;
declare namespace _mintFromCandyMachineOperation {
  var key: "MintFromCandyMachineOperation";
}
/**
 * @group Operations
 * @category Types
 */
export declare type MintFromCandyMachineOperation<
  Settings extends CandyGuardsSettings = DefaultCandyGuardSettings,
  MintSettings extends CandyGuardsMintSettings = DefaultCandyGuardMintSettings
> = Operation<
  typeof Key,
  MintFromCandyMachineInput<Settings, MintSettings>,
  MintFromCandyMachineOutput
>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type MintFromCandyMachineInput<
  Settings extends CandyGuardsSettings = DefaultCandyGuardSettings,
  MintSettings extends CandyGuardsMintSettings = DefaultCandyGuardMintSettings
> = {
  /**
   * The Candy Machine to mint from.
   * We only need a subset of the `CandyMachine` model but we
   * need enough information regarding its settings to know how
   * to mint from it.
   *
   * This includes its address, the address of its Collection NFT and,
   * optionally, the Candy Guard account associated with it.
   */
  candyMachine: Pick<
    CandyMachine<Settings>,
    "address" | "collectionMintAddress" | "candyGuard"
  >;
  /**
   * The address of the update authority of the Collection NFT
   * that is being assigned to each minted NFT.
   */
  collectionUpdateAuthority: PublicKey;
  /**
   * The authority that is allowed to mint NFTs from the Candy Machine.
   *
   * @defaultValue
   * `metaplex.identity()` if the Candy Machine has no associated Candy Guard.
   * Otherwise, this parameter will be ignored.
   */
  mintAuthority?: Signer;
  /**
   * The mint account to create as a Signer.
   * This expects a brand new Keypair with no associated account.
   *
   * @defaultValue `Keypair.generate()`
   */
  mint?: Signer;
  /**
   * The owner of the minted NFT.
   *
   * Defaults to the wallet that is paying for it, i.e. `payer`.
   *
   * @defaultValue `payer.publicKey`
   */
  owner?: PublicKey;
  /**
   * The new token account to create as a Signer.
   *
   * This property would typically be ignored as, by default, it will create a
   * associated token account from the `owner` and `mint` properties.
   *
   * When provided, the `owner` property will be ignored.
   *
   * @defaultValue associated token address of `owner` and `mint`.
   */
  token?: Signer;
  /**
   * The label of the group to mint from.
   *
   * If groups are configured on the Candy Machine,
   * you must specify a group label to mint from.
   *
   * When set to `null` it will mint using the default
   * guards, provided no groups are configured.
   *
   * @defaultValue `null`
   */
  group?: Option<string>;
  /**
   * Guard-specific data required to mint from the Candy Machine.
   *
   * Some guards require additional data to be provided at mint time.
   * For instance, the `allowList` guard will require a Merkle proof
   * ensuring the minting address is allowed to mint.
   *
   * You only need to provide configuration data for the guards
   * that are set up within the group your are minting from.
   *
   * @defaultValue `{}`
   */
  guards?: Partial<MintSettings>;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type MintFromCandyMachineOutput = {
  /** The minted NFT. */
  nft: NftWithToken;
  /** The mint account of the minted NFT as a Signer. */
  mintSigner: Signer;
  /** The address of the minted NFT's token account. */
  tokenAddress: PublicKey;
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const mintFromCandyMachineOperationHandler: OperationHandler<MintFromCandyMachineOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type MintFromCandyMachineBuilderParams<
  Settings extends CandyGuardsSettings = DefaultCandyGuardSettings,
  MintSettings extends CandyGuardsMintSettings = DefaultCandyGuardMintSettings
> = Omit<
  MintFromCandyMachineInput<Settings, MintSettings>,
  "confirmOptions"
> & {
  /** A key to distinguish the instruction that creates the mint account of the NFT. */
  createMintAccountInstructionKey?: string;
  /** A key to distinguish the instruction that initializes the mint account of the NFT. */
  initializeMintInstructionKey?: string;
  /** A key to distinguish the instruction that creates the associated token account of the NFT. */
  createAssociatedTokenAccountInstructionKey?: string;
  /** A key to distinguish the instruction that creates the token account of the NFT. */
  createTokenAccountInstructionKey?: string;
  /** A key to distinguish the instruction that initializes the token account of the NFT. */
  initializeTokenInstructionKey?: string;
  /** A key to distinguish the instruction that mints the one token. */
  mintTokensInstructionKey?: string;
  /** A key to distinguish the instruction that mints from the Candy Machine. */
  mintFromCandyMachineInstructionKey?: string;
};
/**
 * @group Transaction Builders
 * @category Contexts
 */
export declare type MintFromCandyMachineBuilderContext = Omit<
  MintFromCandyMachineOutput,
  "response" | "nft"
>;
/**
 * Mints the next NFT from a given candy machine.
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .candyMachines()
 *   .builders()
 *   .mint({
 *     candyMachine,
 *     collectionUpdateAuthority,
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const mintFromCandyMachineBuilder: <
  Settings extends CandyGuardsSettings = DefaultCandyGuardSettings,
  MintSettings extends CandyGuardsMintSettings = DefaultCandyGuardMintSettings
>(
  metaplex: Metaplex,
  params: MintFromCandyMachineBuilderParams<Settings, MintSettings>,
  options?: TransactionBuilderOptions
) => Promise<TransactionBuilder<MintFromCandyMachineBuilderContext>>;
export {};
