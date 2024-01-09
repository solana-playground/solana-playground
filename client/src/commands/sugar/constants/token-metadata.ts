/** Prefix used for PDAs to avoid certain collision attacks */
export const TOKEN_METADATA_PREFIX = "metadata";

/** Used in seeds to make Edition model pda address */
export const EDITION = "edition";

export const RESERVATION = "reservation";

export const USER = "user";

export const BURN = "burn";

export const COLLECTION_AUTHORITY = "collection_authority";

export const MAX_NAME_LENGTH = 32;

export const MAX_SYMBOL_LENGTH = 10;

export const MAX_URI_LENGTH = 200;

export const MAX_CREATOR_LIMIT = 5;

export const MAX_CREATOR_LEN = 32 + 1 + 1;

export const MAX_DATA_SIZE =
  4 +
  MAX_NAME_LENGTH +
  4 +
  MAX_SYMBOL_LENGTH +
  4 +
  MAX_URI_LENGTH +
  2 +
  1 +
  4 +
  MAX_CREATOR_LIMIT * MAX_CREATOR_LEN;

export const MAX_METADATA_LEN =
  1 + //key
  32 + // update auth pubkey
  32 + // mint pubkey
  MAX_DATA_SIZE +
  1 + // primary sale
  1 + // mutable
  9 + // nonce (pretty sure this only needs to be 2)
  2 + // token standard
  34 + // collection
  18 + // uses
  118; // Padding

export const MAX_EDITION_LEN = 1 + 32 + 8 + 200;

/**
 * Large buffer because the older master editions have two pubkeys in them,
 * need to keep two versions same size because the conversion process actually
 * changes the same account by rewriting it.
 */
export const MAX_MASTER_EDITION_LEN = 1 + 9 + 8 + 264;

export const MAX_RESERVATIONS = 200;

/**
 * Can hold up to 200 keys per reservation.
 *
 * NOTE: the extra 8 is for number of elements in the vec
 */
export const MAX_RESERVATION_LIST_V1_SIZE =
  1 + 32 + 8 + 8 + MAX_RESERVATIONS * 34 + 100;

/**
 * Can hold up to 200 keys per reservation.
 *
 * NOTE: the extra 8 is for number of elements in the vec
 */
export const MAX_RESERVATION_LIST_SIZE =
  1 + 32 + 8 + 8 + MAX_RESERVATIONS * 48 + 8 + 8 + 84;

export const MAX_EDITION_MARKER_SIZE = 32;

export const EDITION_MARKER_BIT_SIZE = 248;

export const USE_AUTHORITY_RECORD_SIZE = 18; //8 byte padding

export const COLLECTION_AUTHORITY_RECORD_SIZE = 11; //10 byte padding
