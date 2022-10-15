import { CreateAccountInput, TransferSolInput } from './operations';
import { SystemBuildersClient } from './SystemBuildersClient';
import type { Metaplex } from '../../Metaplex';
import { OperationOptions } from '../../types';
/**
 * This is a client for the System module.
 *
 * It enables us to interact with the System program in order to
 * create uninitialized accounts and transfer SOL.
 *
 * You may access this client via the `system()` method of your `Metaplex` instance.
 *
 * ```ts
 * const systemClient = metaplex.system();
 * ```
 *
 * @example
 * You can create a new uninitialized account with a given space in bytes
 * using the code below.
 *
 * ```ts
 * const { newAccount } = await metaplex.system().createAccount({ space: 42 });
 * ```
 *
 * @group Modules
 */
export declare class SystemClient {
    protected readonly metaplex: Metaplex;
    constructor(metaplex: Metaplex);
    /**
     * You may use the `builders()` client to access the
     * underlying Transaction Builders of this module.
     *
     * ```ts
     * const buildersClient = metaplex.system().builders();
     * ```
     */
    builders(): SystemBuildersClient;
    /** {@inheritDoc createAccountOperation} */
    createAccount(input: CreateAccountInput, options?: OperationOptions): Promise<import("./operations").CreateAccountOutput>;
    /** {@inheritDoc transferSolOperation} */
    transferSol(input: TransferSolInput, options?: OperationOptions): Promise<import("./operations").TransferSolOutput>;
}
