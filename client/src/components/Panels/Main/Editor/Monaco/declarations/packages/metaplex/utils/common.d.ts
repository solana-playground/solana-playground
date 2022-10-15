export declare const removeEmptyChars: (value: string) => string;
export declare const padEmptyChars: (value: string, chars: number) => string;
export declare const tryOr: <T, U>(callback: () => T, defaultValue: U) => T | U;
export declare const tryOrNull: <T>(cb: () => T) => T | null;
export declare const chunk: <T>(array: T[], chunkSize: number) => T[][];
export declare const zipMap: <T, U, V>(left: T[], right: U[], fn: (t: T, u: U | null, i: number) => V) => V[];
export declare const randomStr: (length?: number, alphabet?: string) => string;
export declare const getContentType: (fileName: string) => string | null;
export declare const getExtension: (fileName: string) => string | null;
export declare type WalkOptions = {
    sortObjectKeys?: boolean;
};
export declare const walk: (parent: any, cb: (next: (child: any) => void, value: any, key: any, parent: any) => unknown, options?: WalkOptions | undefined) => void;
export declare const removeUndefinedAttributes: <T extends {
    [key: string]: any;
}>(object: T) => { [key in keyof T]-?: T[key]; };
