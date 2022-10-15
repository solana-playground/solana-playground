import { MetaplexFile, StorageDriver } from '../storageModule';
import { Amount, BigNumber } from '../../types';
export declare type MockStorageOptions = {
    baseUrl?: string;
    costPerByte?: BigNumber | number;
};
export declare class MockStorageDriver implements StorageDriver {
    protected cache: Record<string, MetaplexFile>;
    readonly baseUrl: string;
    readonly costPerByte: BigNumber;
    constructor(options?: MockStorageOptions);
    getUploadPrice(bytes: number): Promise<Amount>;
    upload(file: MetaplexFile): Promise<string>;
    download(uri: string): Promise<MetaplexFile>;
}
