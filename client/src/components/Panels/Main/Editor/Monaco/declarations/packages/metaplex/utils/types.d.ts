export declare type PartialKeys<T extends object, K extends keyof T = keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export declare type RequiredKeys<T extends object, K extends keyof T = keyof T> = Omit<T, K> & Required<Pick<T, K>>;
export declare type Option<T> = T | null;
export declare type Opaque<T, K> = T & {
    __opaque__: K;
};
