import { MetaplexError, MetaplexErrorInputWithoutSource, MetaplexErrorOptions } from '../../errors';
/** @group Errors */
export declare class CandyMachineV3Error extends MetaplexError {
    constructor(input: MetaplexErrorInputWithoutSource);
}
/** @group Errors */
export declare class UnregisteredCandyGuardError extends CandyMachineV3Error {
    constructor(name: string, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class CandyMachineIsFullError extends CandyMachineV3Error {
    constructor(index: number, itemsAvailable: number, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class CandyMachineCannotAddAmountError extends CandyMachineV3Error {
    constructor(index: number, amount: number, itemsAvailable: number, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class CandyMachineItemTextTooLongError extends CandyMachineV3Error {
    constructor(index: number, type: 'name' | 'uri', text: string, limit: number, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class CandyMachineBotTaxError extends CandyMachineV3Error {
    constructor(explorerLink: string, cause: Error, options?: Omit<MetaplexErrorOptions, 'cause'>);
}
/** @group Errors */
export declare class GuardGroupRequiredError extends CandyMachineV3Error {
    constructor(availableGroups: string[], options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class SelectedGuardGroupDoesNotExistError extends CandyMachineV3Error {
    constructor(selectedGroup: string, availableGroups: string[], options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class GuardMintSettingsMissingError extends CandyMachineV3Error {
    constructor(guardName: string, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class GuardRouteNotSupportedError extends CandyMachineV3Error {
    constructor(guardName: string, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class CandyGuardRequiredOnCandyMachineError extends CandyMachineV3Error {
    constructor(options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class GuardNotEnabledError extends CandyMachineV3Error {
    constructor(guard: string, group: string | null, options?: MetaplexErrorOptions);
}
