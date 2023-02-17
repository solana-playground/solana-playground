import { DateTime } from '../../../types';
/**
 * The endDate guard is used to specify a date to end the mint.
 * Any transaction received after the end date will fail.
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 */
export declare type EndDateGuardSettings = {
    /** The date after which minting is no longer possible. */
    date: DateTime;
};
