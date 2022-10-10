import {
  Creator,
  CandyMachineGatekeeper,
  CandyMachineEndSettings,
  CandyMachineWhitelistMintSettings,
  CandyMachineHiddenSettings,
  Option,
  DateTime,
} from "@metaplex-foundation/js";
import { PublicKey } from "@solana/web3.js";

type PublicKeyToString<T> = {
  [K in keyof T]: T[K] extends PublicKey ? string : T[K];
};

export interface ConfigData {
  price: number;
  number: number;
  gatekeeper: Option<PublicKeyToString<CandyMachineGatekeeper>>;
  creators: PublicKeyToString<Creator>[];
  solTreasuryAccount: Option<string>;
  splTokenAccount: Option<string>;
  splToken: Option<string>;
  goLiveDate: Option<string>;
  endSettings: Option<
    Omit<CandyMachineEndSettings, "number"> & {
      number?: number;
      date?: DateTime;
    }
  >;
  whitelistMintSettings: Option<
    Omit<CandyMachineWhitelistMintSettings, "discountPrice"> & {
      discountPrice: Option<number>;
    }
  >;
  hiddenSettings: Option<CandyMachineHiddenSettings>;
  freezeTime: Option<number>;
  uploadMethod: UploadMethod;
  retainAuthority: boolean;
  isMutable: boolean;
  symbol: string;
  sellerFeeBasisPoints: number;
  awsConfig: Option<AwsConfig>;
  nftStorageAuthToken: Option<string>;
  shdwStorageAccount: Option<string>;
}

enum UploadMethod {
  BUNDLR = 0,
  AWS = 1,
  NFT_STORAGE = 2,
  SHDW = 3,
}

interface AwsConfig {
  bucket: string;
  profile: string;
  directory: string;
}
