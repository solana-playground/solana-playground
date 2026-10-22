import { AnchorProvider, Program } from "@anchor-lang/core";

import { PgCommon } from "../common";
import { PgConnection } from "../connection";
import { PgProgramInfo } from "../program-info";
import { PgWallet } from "../wallet";

/**
 * Create an Anchor program instance.
 *
 * @param params optional overrides of the default playground values
 * @returns the created Anchor program instance.
 */
export const getAnchorProgram = (params?: {
  connection?: typeof PgConnection["current"];
  wallet?: typeof PgWallet["current"];
  idl?: typeof PgProgramInfo["latestIdl"];
}) => {
  const { connection, wallet, idl } = PgCommon.setDefault(params, {
    connection: PgConnection.current,
    wallet: PgWallet.current,
    idl: PgProgramInfo.latestIdl,
  });

  if (!wallet) throw new Error("Not connected");
  if (!idl) throw new Error("Anchor IDL not found");

  const provider = new AnchorProvider(connection, wallet);
  return new Program(idl, provider);
};
