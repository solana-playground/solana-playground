import { BigNumber } from '../../../types';
/**
 * The redeemedAmount guard forbids minting when the
 * number of minted NFTs for the entire Candy Machine
 * reaches the configured maximum amount.
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 */
export declare type RedeemedAmountGuardSettings = {
    /** The maximum amount of NFTs that can be minted using that guard. */
    maximum: BigNumber;
};
