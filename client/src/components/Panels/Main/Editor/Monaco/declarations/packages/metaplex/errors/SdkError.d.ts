import { PublicKey } from '@solana/web3.js';
import { MetaplexError, MetaplexErrorInputWithoutSource, MetaplexErrorOptions } from './MetaplexError';
import { Cluster, Program, Currency } from '../types';
/** @group Errors */
export declare class SdkError extends MetaplexError {
    constructor(input: MetaplexErrorInputWithoutSource);
}
/** @group Errors */
export declare class OperationHandlerMissingError extends SdkError {
    constructor(operationKey: string, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class DriverNotProvidedError extends SdkError {
    constructor(driver: string, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class UnexpectedCurrencyError extends SdkError {
    actual: Currency;
    expected: Currency;
    constructor(actual: Currency, expected: Currency, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class CurrencyMismatchError extends SdkError {
    left: Currency;
    right: Currency;
    operation?: string;
    constructor(left: Currency, right: Currency, operation?: string, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class InvalidJsonVariableError extends SdkError {
    constructor(options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class InvalidJsonStringError extends SdkError {
    constructor(options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class OperationUnauthorizedForGuestsError extends SdkError {
    constructor(operation: string, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class UninitializedWalletAdapterError extends SdkError {
    constructor(options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class OperationNotSupportedByWalletAdapterError extends SdkError {
    constructor(operation: string, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class TaskIsAlreadyRunningError extends SdkError {
    constructor(options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class AssetNotFoundError extends SdkError {
    constructor(location: string, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class AccountNotFoundError extends SdkError {
    constructor(address: PublicKey, accountType?: string, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class UnexpectedAccountError extends SdkError {
    constructor(address: PublicKey, expectedType: string, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class UnexpectedTypeError extends SdkError {
    constructor(variable: string, actualType: string, expectedType: string, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class ExpectedSignerError extends SdkError {
    constructor(variable: string, actualType: string, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class ProgramNotRecognizedError extends SdkError {
    nameOrAddress: string | PublicKey;
    cluster: Cluster;
    constructor(nameOrAddress: string | PublicKey, cluster: Cluster, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class MissingGpaBuilderError extends SdkError {
    program: Program;
    constructor(program: Program, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class NoInstructionsToSendError extends SdkError {
    constructor(operation: string, solution?: string, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class FailedToSerializeDataError extends SdkError {
    constructor(dataDescription: string, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class MissingInputDataError extends SdkError {
    constructor(missingParameters: string[], options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class FailedToDeserializeDataError extends SdkError {
    constructor(dataDescription: string, options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class NotYetImplementedError extends SdkError {
    constructor(options?: MetaplexErrorOptions);
}
/** @group Errors */
export declare class UnreachableCaseError extends SdkError {
    constructor(value: never, options?: MetaplexErrorOptions);
}
