import { IdentitySigner } from '../../types';
export declare type IdentityDriver = IdentitySigner & {
    secretKey?: Uint8Array;
};
