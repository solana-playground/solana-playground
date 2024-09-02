import {
  MAX_CREATOR_LEN,
  MAX_CREATOR_LIMIT,
  MAX_NAME_LENGTH,
  MAX_SYMBOL_LENGTH,
  MAX_URI_LENGTH,
} from "./token-metadata";
import { PgWeb3 } from "../../../utils/pg";

export const EXPIRE_OFFSET = 10 * 60;
export const CANDY_MACHINE_PREFIX = "candy_machine";

export const BOT_FEE = 10000000;
export const FREEZE_FEE = 0; //100000; // 0.0001 SOL

export const MAX_FREEZE_TIME = 60 * 60 * 24 * 31; // 1 month

export const COLLECTIONS_FEATURE_INDEX = 0;
export const FREEZE_FEATURE_INDEX = 1;
export const FREEZE_LOCK_FEATURE_INDEX = 2;

export const COLLECTION_PDA_SIZE = 8 + 32 + 32;

export const CONFIG_LINE_SIZE = 4 + MAX_NAME_LENGTH + 4 + MAX_URI_LENGTH;

export const BLOCK_HASHES = new PgWeb3.PublicKey(
  "SysvarRecentB1ockHashes11111111111111111111"
);
export const GUMDROP_ID = new PgWeb3.PublicKey(
  "gdrpGjVffourzkdDRrQmySw4aTHr8a3xmQzzxSwFD1a"
);
export const CUPCAKE_ID = new PgWeb3.PublicKey(
  "cakeGJxEdGpZ3MJP8sM3QypwzuzZpko1ueonUQgKLPE"
);
export const A_TOKEN = new PgWeb3.PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);
export const COMPUTE_BUDGET = new PgWeb3.PublicKey(
  "ComputeBudget111111111111111111111111111111"
);

export const CONFIG_ARRAY_START =
  8 + // key
  32 + // authority
  32 + //wallet
  33 + // token mint
  4 +
  6 + // uuid
  8 + // price
  8 + // items available
  9 + // go live
  10 + // end settings
  4 +
  MAX_SYMBOL_LENGTH + // u32 len + symbol
  2 + // seller fee basis points
  4 +
  MAX_CREATOR_LIMIT * MAX_CREATOR_LEN + // optional + u32 len + actual vec
  8 + //max supply
  1 + // is mutable
  1 + // retain authority
  1 + // option for hidden setting
  4 +
  MAX_NAME_LENGTH + // name length,
  4 +
  MAX_URI_LENGTH + // uri length,
  32 + // hash
  4 + // max number of lines;
  8 + // items redeemed
  1 + // whitelist option
  1 + // whitelist mint mode
  1 + // allow presale
  9 + // discount price
  32 + // mint key for whitelist
  1 +
  32 +
  1; // gatekeeper
