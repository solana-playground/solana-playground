/**
 * The mintLimit guard allows to specify a limit on the
 * number of mints for each individual wallet.
 *
 * The limit is set per wallet, per candy machine and per
 * identified (provided in the settings) to allow multiple
 * mint limits within a Candy Machine. This is particularly
 * useful when using groups of guards and we want each of them
 * to have a different mint limit.
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 */
export declare type MintLimitGuardSettings = {
    /**
     * A unique identitifer for the limit
     * for a given wallet and candy machine.
     */
    id: number;
    /** The maximum number of mints allowed. */
    limit: number;
};
