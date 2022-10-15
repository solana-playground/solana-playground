import { CandyMachineV2Item, CandyMachineV2EndSettings } from './models';
import { MetaplexError, MetaplexErrorInputWithoutSource, MetaplexErrorOptions } from '../../errors';
import { BigNumber, DateTime } from '../../types';
import { Option } from '../../utils';
/** @group Errors */
export declare class CandyMachineV2Error extends MetaplexError {
    constructor(input: MetaplexErrorInputWithoutSource);
}
/** @group Errors */
export declare class CandyMachineV2IsFullError extends CandyMachineV2Error {
    constructor(assetIndex: BigNumber, itemsAvailable: BigNumber, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class CandyMachineV2IsEmptyError extends CandyMachineV2Error {
    constructor(itemsAvailable: BigNumber, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class CandyMachineV2CannotAddAmountError extends CandyMachineV2Error {
    constructor(index: BigNumber, amount: number, itemsAvailable: BigNumber, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class CandyMachineV2AddItemConstraintsViolatedError extends CandyMachineV2Error {
    constructor(index: BigNumber, item: CandyMachineV2Item, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class CandyMachineV2NotLiveError extends CandyMachineV2Error {
    constructor(goLiveDate: Option<DateTime>, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class CandyMachineV2EndedError extends CandyMachineV2Error {
    constructor(endSetting: CandyMachineV2EndSettings, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class CandyMachineV2BotTaxError extends CandyMachineV2Error {
    constructor(explorerLink: string, cause: Error, options?: Omit<MetaplexErrorOptions, 'cause'>);
}
