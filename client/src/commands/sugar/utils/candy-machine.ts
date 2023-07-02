import type { PublicKey } from "@solana/web3.js";

export const assertCorrectAuthority = (
  userPk: PublicKey,
  updateAuthorityPk: PublicKey
) => {
  if (!userPk.equals(updateAuthorityPk)) {
    throw new Error(
      "Update authority does not match that of the candy machine."
    );
  }
};
