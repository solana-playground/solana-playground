import {
  BigNumber,
  Creator,
  CandyMachineGatekeeper,
  CandyMachineEndSettings,
  CandyMachineWhitelistMintSettings,
  CandyMachineHiddenSettings,
  Option,
} from "@metaplex-foundation/js";

export interface ConfigData {
  price: number;
  number: BigNumber;
  gatekeeper: Option<CandyMachineGatekeeper>;
  creators: Creator[];
  solTreasuryAccount: Option<string>;
  splTokenAccount: Option<string>;
  splToken: Option<string>;
  goLiveDate: Option<string>;
  endSettings: Option<CandyMachineEndSettings>;
  whitelistMintSettings: Option<CandyMachineWhitelistMintSettings>;
  hiddenSettings: Option<CandyMachineHiddenSettings>;
  freezeTime: Option<BigNumber>;
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
