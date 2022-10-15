import { CandyMachine, CandyMachineItem } from './models';
export declare const assertNotFull: (candyMachine: Pick<CandyMachine, 'itemsAvailable' | 'itemsLoaded'>, index: number) => void;
export declare const assertCanAdd: (candyMachine: Pick<CandyMachine, 'itemsAvailable'>, index: number, amount: number) => void;
export declare const assertAllItemConstraints: (candyMachine: Pick<CandyMachine, 'itemSettings'>, items: Pick<CandyMachineItem, 'name' | 'uri'>[]) => void;
