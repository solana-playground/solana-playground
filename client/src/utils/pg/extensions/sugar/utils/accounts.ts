import { Metaplex } from "@metaplex-foundation/js";

import {
  MAX_NAME_LENGTH,
  MAX_SYMBOL_LENGTH,
  MAX_URI_LENGTH,
} from "../constants";

export const getCmCreatorMetadataAccounts = async (
  metaplex: Metaplex,
  creator: string,
  position: number = 0
) => {
  if (position > 4) {
    throw new Error("CM Creator position cannot be greater than 4");
  }

  return await metaplex
    .rpc()
    .getProgramAccounts(metaplex.programs().getTokenMetadata().address, {
      filters: [
        {
          memcmp: {
            offset:
              1 + // key
              32 + // update auth
              32 + // mint
              4 + // name string length
              MAX_NAME_LENGTH + // name
              4 + // uri string length
              MAX_URI_LENGTH + // uri*
              4 + // symbol string length
              MAX_SYMBOL_LENGTH + // symbol
              2 + // seller fee basis points
              1 + // whether or not there is a creators vec
              4 + // creators
              position * // index for each creator
                (32 + // address
                  1 + // verified
                  1), // share
            bytes: creator,
          },
        },
      ],
      encoding: "base64",
      commitment: "confirmed",
    });
};
