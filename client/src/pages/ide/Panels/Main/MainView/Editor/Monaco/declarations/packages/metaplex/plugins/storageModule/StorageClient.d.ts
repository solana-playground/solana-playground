import { MetaplexFile } from './MetaplexFile';
import { StorageDownloadOptions, StorageDriver } from './StorageDriver';
import { Amount, HasDriver } from '../../types';
/**
 * @group Modules
 */
export declare class StorageClient implements HasDriver<StorageDriver> {
    private _driver;
    driver(): StorageDriver;
    setDriver(newDriver: StorageDriver): void;
    getUploadPriceForBytes(bytes: number): Promise<Amount>;
    getUploadPriceForFile(file: MetaplexFile): Promise<Amount>;
    getUploadPriceForFiles(files: MetaplexFile[]): Promise<Amount>;
    upload(file: MetaplexFile): Promise<string>;
    uploadAll(files: MetaplexFile[]): Promise<string[]>;
    uploadJson<T extends object = object>(json: T): Promise<string>;
    download(uri: string, options?: StorageDownloadOptions): Promise<MetaplexFile>;
    downloadJson<T extends object = object>(uri: string, options?: StorageDownloadOptions): Promise<T>;
}
