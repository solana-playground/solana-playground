import { MetaplexError } from '../errors';
/**
 * Error indicating that an assertion failed.
 * @group Errors
 */
export declare class AssertionError extends Error {
    constructor(message: string);
}
/**
 * Asserts that a given object contains the specified
 * keys such that their values are defined.
 */
export declare function assertObjectHasDefinedKeys<T extends object, K extends keyof T = keyof T>(input: T, keys: K[], onError: (missingKeys: K[]) => MetaplexError): asserts input is {
    [key in keyof T]: T[key];
} & {
    [key in K]-?: T[key];
};
