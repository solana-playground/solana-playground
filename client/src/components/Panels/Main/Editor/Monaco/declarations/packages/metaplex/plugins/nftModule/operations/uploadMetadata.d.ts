import { MetaplexFile } from '../../storageModule';
import { JsonMetadata } from '../models';
import { Operation, OperationHandler } from '../../../types';
declare const Key: "UploadMetadataOperation";
/**
 * Uploads a JSON Metadata object to the current storage provider.
 *
 * ```ts
 * const { uri } = await metaplex
 *   .nfts()
 *   .uploadMetadata({
 *     name: "My NFT",
 *     description: "My description",
 *     image: "https://arweave.net/123",
 *   };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const uploadMetadataOperation: import("../../../types").OperationConstructor<UploadMetadataOperation, "UploadMetadataOperation", UploadMetadataInput, UploadMetadataOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type UploadMetadataOperation = Operation<typeof Key, UploadMetadataInput, UploadMetadataOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type UploadMetadataInput = JsonMetadata<MetaplexFile | string>;
/**
 * @group Operations
 * @category Outputs
 */
export declare type UploadMetadataOutput = {
    /** The uploaded JSON metadata. */
    metadata: JsonMetadata;
    /**
     * The URIs of all assets that were uploaded
     * within the provided metadata.
     */
    assetUris: string[];
    /** The URI of the uploaded JSON metadata. */
    uri: string;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const uploadMetadataOperationHandler: OperationHandler<UploadMetadataOperation>;
export declare const getAssetsFromJsonMetadata: (input: UploadMetadataInput) => MetaplexFile[];
export declare const replaceAssetsWithUris: (input: UploadMetadataInput, replacements: string[]) => JsonMetadata;
export {};
