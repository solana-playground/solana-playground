import { Program } from '../../types';
/** @group Programs */
export declare const candyMachineProgram: Program;
/** @group Programs */
export declare type CandyGuardProgram = Program & {
    availableGuards: string[];
};
export declare const isCandyGuardProgram: (value: Program) => value is CandyGuardProgram;
export declare function assertCandyGuardProgram(value: Program): asserts value is CandyGuardProgram;
/** @group Programs */
export declare const defaultCandyGuardProgram: CandyGuardProgram;
/** @group Programs */
export declare const gatewayProgram: Program;
