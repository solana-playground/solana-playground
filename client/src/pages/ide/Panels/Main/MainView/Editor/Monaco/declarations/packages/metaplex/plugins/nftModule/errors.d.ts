import { PublicKey } from '@solana/web3.js';
import { MetaplexError, MetaplexErrorInputWithoutSource, MetaplexErrorOptions } from '../../errors';
/** @group Errors */
export declare class NftError extends MetaplexError {
    constructor(input: MetaplexErrorInputWithoutSource);
}
/** @group Errors */
export declare class ParentCollectionMissingError extends NftError {
    constructor(mint: PublicKey, operation: string, options?: MetaplexErrorOptions);
}
