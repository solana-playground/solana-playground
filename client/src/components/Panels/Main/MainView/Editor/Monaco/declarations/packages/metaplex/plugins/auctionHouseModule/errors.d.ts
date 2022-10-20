import { MetaplexError, MetaplexErrorInputWithoutSource, MetaplexErrorOptions } from '../../errors';
import { Amount } from '../../types';
/** @group Errors */
export declare class AuctionHouseError extends MetaplexError {
    constructor(input: MetaplexErrorInputWithoutSource);
}
/** @group Errors */
export declare class TreasuryDestinationOwnerRequiredError extends AuctionHouseError {
    constructor(options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class AuctioneerAuthorityRequiredError extends AuctionHouseError {
    constructor(options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class AuctioneerPartialSaleNotSupportedError extends AuctionHouseError {
    constructor(options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class BidAndListingHaveDifferentAuctionHousesError extends AuctionHouseError {
    constructor(options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class BidAndListingHaveDifferentMintsError extends AuctionHouseError {
    constructor(options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class CanceledBidIsNotAllowedError extends AuctionHouseError {
    constructor(options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class CanceledListingIsNotAllowedError extends AuctionHouseError {
    constructor(options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class CreateListingRequiresSignerError extends AuctionHouseError {
    constructor(options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class WithdrawFromBuyerAccountRequiresSignerError extends AuctionHouseError {
    constructor(options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class PartialPriceMismatchError extends AuctionHouseError {
    constructor(expected: Amount, actual: Amount, options?: MetaplexErrorOptions);
}
