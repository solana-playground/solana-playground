import { CandyMachineClient } from './CandyMachineClient';
import { CandyGuardProgram } from './programs';
import { MetaplexPlugin, Program } from '../../types';
/** @group Plugins */
export declare const candyMachineModule: () => MetaplexPlugin;
declare module '../../Metaplex' {
    interface Metaplex {
        candyMachines(): CandyMachineClient;
    }
}
declare module '../programModule/ProgramClient' {
    interface ProgramClient {
        getCandyMachine(programs?: Program[]): Program;
        getCandyGuard<T extends CandyGuardProgram>(programs?: Program[]): T;
        getGateway(programs?: Program[]): Program;
    }
}
