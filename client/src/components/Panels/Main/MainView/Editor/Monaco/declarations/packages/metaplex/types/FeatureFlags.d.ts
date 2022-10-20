import { Buffer } from 'buffer';
export declare type FeatureFlags = boolean[];
/**
 * Serializes an array of boolean into a Buffer. The `byteSize` parameter
 * can be used to create a fixed-size Buffer, otherwise the Buffer will
 * have the minimum amount of bytes required to store the boolean array.
 */
export declare const serializeFeatureFlags: (features: FeatureFlags, byteSize?: number | undefined, littleEndian?: boolean) => Buffer;
/**
 * Parses a Buffer into an array of booleans using the bits
 * of the buffer. The number of flags is required to know
 * how many bits to read and how many booleans to return.
 */
export declare const deserializeFeatureFlags: (buffer: Buffer, numberOfFlags: number, offset?: number, littleEndian?: boolean) => [FeatureFlags, number];
