import {
  MAX_CREATOR_LEN,
  MAX_CREATOR_LIMIT,
  MAX_NAME_LENGTH,
  MAX_SYMBOL_LENGTH,
  MAX_URI_LENGTH,
} from "./token-metadata";

// Empty value used for string padding.
export const NULL_STRING = "\0";

// Constant to define the replacement index string.
export const REPLACEMENT_INDEX = "$ID$";

// Constant to define the replacement index increment string.
export const REPLACEMENT_INDEX_INCREMENT = "$ID+1$";

// Empty string constant.
export const EMPTY_STR = "";

// Seed used to derive the authority PDA address.
export const AUTHORITY_SEED = "candy_machine";

// Determine the start of the account hidden section.
export const HIDDEN_SECTION =
  8 + // discriminator
  8 + // features
  32 + // authority
  32 + // mint authority
  32 + // collection mint
  8 + // items redeemed
  8 + // items available (config data)
  4 +
  MAX_SYMBOL_LENGTH + // u32 + max symbol length
  2 + // seller fee basis points
  8 + // max supply
  1 + // is mutable
  4 +
  MAX_CREATOR_LIMIT * MAX_CREATOR_LEN + // u32 + creators vec
  1 + // option (config lines settings)
  4 +
  MAX_NAME_LENGTH + // u32 + max name length
  4 + // name length
  4 +
  MAX_URI_LENGTH + // u32 + max uri length
  4 + // uri length
  1 + // is sequential
  1 + // option (hidden setting)
  4 +
  MAX_NAME_LENGTH + // u32 + max name length
  4 +
  MAX_URI_LENGTH + // u32 + max uri length
  32; // hash
