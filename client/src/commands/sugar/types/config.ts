import { BigNumber, Creator, Option } from "@metaplex-foundation/js";
import { HiddenSettings } from "@metaplex-foundation/mpl-candy-machine-core";

import type { CandyGuardData } from "./guard-data";
import type { PgWeb3 } from "../../../utils/pg";

export type ToPrimitive<T> = {
  [K in keyof T]: T[K] extends PgWeb3.PublicKey
    ? string
    : T[K] extends BigNumber
    ? number
    : ToPrimitive<T[K]>;
};

export interface ConfigData {
  /** Number of assets available */
  size: BigNumber;

  /** Symbol for the asset */
  symbol: string;

  /** Secondary sales royalty basis points (0-10000) */
  royalties: number;

  /** Indicates if the asset is mutable or not (default yes) */
  isMutable: boolean;

  /** Indicates whether the index generation is sequential or not */
  isSequential: boolean;

  /** List of creators */
  creators: Omit<Creator, "verified">[];

  /** Hidden setttings */
  hiddenSettings: Option<HiddenSettings>;

  /** Upload method configuration */
  uploadConfig: UploadConfig;

  /** Guards configuration */
  guards: Option<CandyGuardData>;
}

interface UploadConfig {
  /** Upload method to use */
  method: UploadMethod;

  /** AWS specific configuration */
  awsConfig: Option<AwsConfig>;

  /** NFT.Storage specific configuration */
  nftStorageAuthToken: Option<string>;

  /** Shadow Drive specific configuration */
  shdwStorageAccount: Option<string>;

  /** Pinata specific configuration */
  pinataConfig: Option<PinataConfig>;
}

/** Sugar compatible upload method names */
export enum UploadMethod {
  BUNDLR = "bundlr",
  AWS = "aws",
  NFT_STORAGE = "nft_storage",
  SHDW = "shdw",
  PINATA = "pinata",
}

interface AwsConfig {
  bucket: string;
  profile: string;
  directory: string;
  domain: Option<string>;
}

interface PinataConfig {
  jwt: string;
  apiGateway: string;
  contentGateway: string;
  parallelLimit: Option<number>;
}
