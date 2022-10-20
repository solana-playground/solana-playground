/// <reference types="node" />
import type { Buffer } from 'buffer';
import BN from 'bn.js';
import { Opaque, Option } from '../utils';
export declare type BigNumber = Opaque<BN, 'BigNumber'>;
export declare type BigNumberValues = number | string | number[] | Uint8Array | Buffer | BN;
export declare const toBigNumber: (value: BigNumberValues, endian?: BN.Endianness | undefined) => BigNumber;
export declare const toOptionBigNumber: (value: Option<BigNumberValues>) => Option<BigNumber>;
export declare const isBigNumber: (value: any) => value is BigNumber;
export declare function assertBigNumber(value: any): asserts value is BigNumber;
