import { PublicKey } from '@solana/web3.js';
import { MetaplexError, MetaplexErrorInputWithoutSource, MetaplexErrorOptions } from '../../errors';
/** @group Errors */
export declare class TokenError extends MetaplexError {
    constructor(input: MetaplexErrorInputWithoutSource);
}
/** @group Errors */
export declare class MintAuthorityMustBeSignerToMintInitialSupplyError extends TokenError {
    constructor(options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class TokenAndMintDoNotMatchError extends TokenError {
    constructor(token: PublicKey, tokenMint: PublicKey, mint: PublicKey, options?: MetaplexErrorOptions);
}
