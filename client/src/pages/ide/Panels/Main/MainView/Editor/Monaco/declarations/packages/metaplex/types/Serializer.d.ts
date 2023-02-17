/// <reference types="node" />
import { Buffer } from 'buffer';
import type { Beet } from '@metaplex-foundation/beet';
import { Account, MaybeAccount, UnparsedAccount, UnparsedMaybeAccount } from './Account';
export declare type Serializer<T> = {
    description: string;
    serialize: (value: T) => Buffer;
    deserialize: (buffer: Buffer, offset?: number) => [T, number];
};
export declare const mapSerializer: <T, U>(serializer: Serializer<T>, map: (value: T) => U, unmap: (value: U) => T) => Serializer<U>;
export declare const createSerializerFromBeet: <T>(beetArg: Beet<T, Partial<T>>) => Serializer<T>;
export declare type SolitaType<T> = {
    name: string;
    deserialize: (data: Buffer, offset?: number) => [T, number];
    fromArgs: (args: T) => {
        serialize: () => [Buffer, number];
    };
};
export declare const createSerializerFromSolitaType: <T>(solitaType: SolitaType<T>, description?: string | undefined) => Serializer<T>;
export declare const serialize: <T>(value: T, serializer: Pick<Serializer<T>, "description" | "serialize">) => Buffer;
export declare const deserialize: <T>(value: Buffer, serializer: Pick<Serializer<T>, "description" | "deserialize">) => [T, number];
export declare function deserializeAccount<T>(account: UnparsedMaybeAccount, serializer: Pick<Serializer<T>, 'description' | 'deserialize'>): MaybeAccount<T>;
export declare function deserializeAccount<T>(account: UnparsedAccount, serializer: Pick<Serializer<T>, 'description' | 'deserialize'>): Account<T>;
export declare const serializeDiscriminator: (discriminator: number[]) => Buffer;
