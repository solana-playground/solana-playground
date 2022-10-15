import { MetaplexError, MetaplexErrorInputWithoutSource, MetaplexErrorOptions } from './MetaplexError';
import { Program } from '../types';
declare type UnderlyingProgramError = Error & {
    code?: number;
    logs?: string[];
};
/** @group Errors */
export declare class ProgramError extends MetaplexError {
    program: Program;
    constructor(program: Program, input: MetaplexErrorInputWithoutSource);
}
/** @group Errors */
export declare class ParsedProgramError extends ProgramError {
    constructor(program: Program, cause: UnderlyingProgramError, options?: Omit<MetaplexErrorOptions, 'cause' | 'logs'>);
}
/** @group Errors */
export declare class UnknownProgramError extends ProgramError {
    constructor(program: Program, cause: UnderlyingProgramError, options?: Omit<MetaplexErrorOptions, 'cause' | 'logs'>);
}
export {};
