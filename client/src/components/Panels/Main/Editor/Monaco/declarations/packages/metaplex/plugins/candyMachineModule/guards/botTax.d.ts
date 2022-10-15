import { SolAmount } from '../../../types';
/**
 * The botTax guard charges a penalty for invalid transactions
 * in order to discourage bots from attempting to mint NFTs.
 *
 * This bot tax works in combinaison with other guards and
 * will trigger whenever a minting wallet attempts to mint
 * an NFT such that other guards would have rejected the mint.
 *
 * For example, if you have a startDate guard and a botTax guard,
 * anyone trying to mint before the defined start date will be
 * charged the bot tax instead of receiving a specific startDate error.
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 */
export declare type BotTaxGuardSettings = {
    /** The amount in SOL to charge for an invalid transaction. */
    lamports: SolAmount;
    /**
     * Whether or not we should charge the bot tax when a mint instruction
     * is not the last instruction of the transaction.
     *
     * This is useful if you want to prevent bots from adding extra instructions
     * after minting to detect if a bot tax was charged and, in this case,
     * throw an error to make the transaction fail and avoid the bot tax.
     */
    lastInstruction: boolean;
};
