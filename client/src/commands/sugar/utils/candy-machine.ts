import type { PgWeb3 } from "../../../utils/pg";

export const assertCorrectAuthority = (
  userPk: PgWeb3.PublicKey,
  updateAuthorityPk: PgWeb3.PublicKey
) => {
  if (!userPk.equals(updateAuthorityPk)) {
    throw new Error(
      "Update authority does not match that of the candy machine."
    );
  }
};
