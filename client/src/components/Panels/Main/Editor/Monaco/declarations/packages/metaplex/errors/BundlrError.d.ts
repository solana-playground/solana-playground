import { MetaplexError, MetaplexErrorInputWithoutSource, MetaplexErrorOptions } from './MetaplexError';
/** @group Errors */
export declare class BundlrError extends MetaplexError {
    constructor(input: MetaplexErrorInputWithoutSource);
}
/** @group Errors */
export declare class FailedToInitializeBundlrError extends BundlrError {
    constructor(options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class FailedToConnectToBundlrAddressError extends BundlrError {
    constructor(address: string, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class AssetUploadFailedError extends BundlrError {
    constructor(status: number, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class BundlrWithdrawError extends BundlrError {
    constructor(status: number, options?: MetaplexErrorOptions);
}
