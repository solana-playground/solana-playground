import { PublicKey } from "@solana/web3.js";
import { Metaplex } from "../Metaplex";
import { Cluster } from ".";
import { GpaBuilder } from "../utils";
export declare type ErrorWithLogs = Error & {
  logs: string[];
};
export declare type ErrorWithCode = Error & {
  code: number;
};
export declare const isErrorWithLogs: (
  error: unknown
) => error is ErrorWithLogs;
export declare type Program = {
  name: string;
  address: PublicKey;
  clusterFilter?: (cluster: Cluster) => boolean;
  errorResolver?: (error: ErrorWithLogs) => ErrorWithCode | null | undefined;
  gpaResolver?: (metaplex: Metaplex) => GpaBuilder;
};
