import type { PublicKey } from '@solana/web3.js';
import { CandyMachinesV2BuildersClient } from './CandyMachinesV2BuildersClient';
import { CandyMachineV2 } from './models';
import { CreateCandyMachineV2Input, DeleteCandyMachineV2Input, FindCandyMachineV2ByAddressInput, FindCandyMachinesV2ByPublicKeyFieldInput, FindMintedNftsByCandyMachineV2Input, InsertItemsToCandyMachineV2Input, MintCandyMachineV2Input, UpdateCandyMachineV2Input } from './operations';
import { OperationOptions } from '../../types';
import type { Metaplex } from '../../Metaplex';
/**
 * This is a client for the Candy Machine module.
 *
 * It enables us to interact with the Candy Machine program in order to
 * create, update and delete Candy Machines as well as mint from them.
 *
 * You may access this client via the `candyMachinesV2()` method of your `Metaplex` instance.
 *
 * ```ts
 * const candyMachineV2Client = metaplex.candyMachinesV2();
 * ```
 *
 * @example
 * You can create a new Candy Machine with minimum input like so.
 * By default, the current identity of the Metaplex instance will be
 * the authority of the Candy Machine.
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
 * @see {@link CandyMachine} The `CandyMachine` model
 * @group Modules
 */
export declare class CandyMachinesV2Client {
    readonly metaplex: Metaplex;
    constructor(metaplex: Metaplex);
    /**
     * You may use the `builders()` client to access the
     * underlying Transaction Builders of this module.
     *
     * ```ts
     * const buildersClient = metaplex.candyMachinesV2().builders();
     * ```
     */
    builders(): CandyMachinesV2BuildersClient;
    /** {@inheritDoc createCandyMachineV2Operation} */
    create(input: CreateCandyMachineV2Input, options?: OperationOptions): Promise<import("./operations").CreateCandyMachineV2Output>;
    /** {@inheritDoc deleteCandyMachineV2Operation} */
    delete(input: DeleteCandyMachineV2Input, options?: OperationOptions): Promise<import("./operations").DeleteCandyMachineV2Output>;
    /** {@inheritDoc findCandyMachinesV2ByPublicKeyFieldOperation} */
    findAllBy(input: FindCandyMachinesV2ByPublicKeyFieldInput, options?: OperationOptions): Promise<CandyMachineV2[]>;
    /** {@inheritDoc findCandyMachineV2ByAddressOperation} */
    findByAddress(input: FindCandyMachineV2ByAddressInput, options?: OperationOptions): Promise<CandyMachineV2>;
    /** {@inheritDoc findMintedNftsByCandyMachineV2Operation} */
    findMintedNfts(input: FindMintedNftsByCandyMachineV2Input, options?: OperationOptions): Promise<import("./operations").FindMintedNftsByCandyMachineV2Output>;
    /** {@inheritDoc insertItemsToCandyMachineV2Operation} */
    insertItems(input: InsertItemsToCandyMachineV2Input, options?: OperationOptions): Promise<import("./operations").InsertItemsToCandyMachineV2Output>;
    /** {@inheritDoc mintCandyMachineV2Operation} */
    mint(input: MintCandyMachineV2Input, options?: OperationOptions): Promise<import("./operations").MintCandyMachineV2Output>;
    /**
     * Helper method that refetches a given Candy Machine.
     *
     * ```ts
     * const candyMachine = await metaplex.candyMachinesV2().refresh(candyMachine);
     * ```
     */
    refresh(candyMachine: CandyMachineV2 | PublicKey, options?: OperationOptions): Promise<CandyMachineV2>;
    /** {@inheritDoc updateCandyMachineV2Operation} */
    update(input: UpdateCandyMachineV2Input, options?: OperationOptions): Promise<import("./operations").UpdateCandyMachineV2Output>;
}
