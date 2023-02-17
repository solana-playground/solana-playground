import { CreateAccountBuilderParams, TransferSolBuilderParams } from './operations';
import type { Metaplex } from '../../Metaplex';
import { TransactionBuilderOptions } from '../../utils';
/**
 * This client allows you to access the underlying Transaction Builders
 * for the write operations of the System module.
 *
 * @see {@link SystemClient}
 * @group Module Builders
 * */
export declare class SystemBuildersClient {
    protected readonly metaplex: Metaplex;
    constructor(metaplex: Metaplex);
    /** {@inheritDoc createAccountBuilder} */
    createAccount(input: CreateAccountBuilderParams, options?: TransactionBuilderOptions): Promise<import("../../utils").TransactionBuilder<import("./operations").CreateAccountBuilderContext>>;
    /** {@inheritDoc transferSolBuilder} */
    transferSol(input: TransferSolBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
}
