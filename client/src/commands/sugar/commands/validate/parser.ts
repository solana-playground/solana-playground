import type { Creator } from "@metaplex-foundation/js";

import {
  MAX_NAME_LENGTH,
  MAX_SYMBOL_LENGTH,
  MAX_URI_LENGTH,
  VALID_CATEGORIES,
} from "../../constants";
import { PgCommon } from "../../../../utils/pg";
import type { ToPrimitive } from "../../types";

export const checkName = (name: string) => {
  if (name.length > MAX_NAME_LENGTH) {
    throw new Error("Name exceeds 32 chars.");
  }
};

export const checkSymbol = (symbol: string) => {
  if (symbol.length > MAX_SYMBOL_LENGTH) {
    throw new Error("Symbol exceeds 10 chars.");
  }
};

export const checkUrl = (url: string) => {
  if (url.length > MAX_URI_LENGTH) {
    throw new Error("Url exceeds 200 chars.");
  }
};

export const checkSellerFeeBasisPoints = (sellerFeeBasisPoints: number) => {
  if (sellerFeeBasisPoints > 10000) {
    throw new Error(
      `Seller fee basis points value '${sellerFeeBasisPoints}' is invalid: must be between 0 and 10,000.`
    );
  }
};

export const checkCreatorsShares = (creators: Creator[]) => {
  let shares = 0;
  for (const creator of creators) {
    shares += creator.share;
  }

  if (shares !== 100) {
    throw new Error("Combined creators' share does not equal 100%.");
  }
};

export const checkCreatorsAddresses = (creators: ToPrimitive<Creator>[]) => {
  for (const creator of creators) {
    if (!PgCommon.isPk(creator.address)) {
      throw new Error(`Creator address: '${creator.address}' is invalid.`);
    }
  }
};

export const checkCategory = (category: string) => {
  if (!VALID_CATEGORIES.includes(category)) {
    throw new Error(
      `Invalid category '${category}': must be one of: ${VALID_CATEGORIES}`
    );
  }
};
