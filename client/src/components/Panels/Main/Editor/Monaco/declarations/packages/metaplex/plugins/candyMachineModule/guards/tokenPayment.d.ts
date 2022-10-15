import { PublicKey, SplTokenAmount } from '../../../types';
/**
 * The tokenPayment guard allows minting by charging the
 * payer a specific amount of tokens from a certain mint acount.
 * The tokens will be transfered to a predefined destination.
 *
 * This guard alone does not limit how many times a holder
 * can mint. A holder can mint as many times as they have
 * the required amount of tokens to pay with.
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 */
export declare type TokenPaymentGuardSettings = {
    /** The mint address of the required tokens. */
    tokenMint: PublicKey;
    /** The amount of tokens required to mint an NFT. */
    amount: SplTokenAmount;
    /** The associated token address to send the tokens to. */
    destinationAta: PublicKey;
};
