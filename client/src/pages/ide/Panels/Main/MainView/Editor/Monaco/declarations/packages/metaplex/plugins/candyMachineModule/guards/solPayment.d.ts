import { PublicKey, SolAmount } from '../../../types';
/**
 * The solPayment guard is used to charge an
 * amount in SOL for the minted NFT.
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 */
export declare type SolPaymentGuardSettings = {
    /** The amount in SOL to charge for. */
    amount: SolAmount;
    /** The configured destination address to send the funds to. */
    destination: PublicKey;
};
