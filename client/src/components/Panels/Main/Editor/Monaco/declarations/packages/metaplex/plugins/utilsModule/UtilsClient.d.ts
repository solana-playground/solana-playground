import type { Metaplex } from '../../Metaplex';
import { SolAmount } from '../../types';
/**
 * @group Modules
 */
export declare class UtilsClient {
    protected readonly metaplex: Metaplex;
    protected cachedRentPerEmptyAccount: SolAmount | null;
    protected cachedRentPerByte: SolAmount | null;
    constructor(metaplex: Metaplex);
    estimate(bytes: number, numberOfAccounts?: number, numberOfTransactions?: number, useCache?: boolean): Promise<SolAmount>;
    estimateRent(bytes: number, numberOfAccounts?: number, useCache?: boolean): Promise<SolAmount>;
    estimateTransactionFee(numberOfTransactions?: number): SolAmount;
}
