import { AnchorProvider, Program } from "@coral-xyz/anchor";

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
  programId?: typeof PgProgramInfo["pk"];
  idl?: typeof PgProgramInfo["idl"];
}) => {
  const { connection, wallet, programId, idl } = PgCommon.setDefault(params, {
    connection: PgConnection.current,
    wallet: PgWallet.current,
    programId: PgProgramInfo.pk,
    idl: PgProgramInfo.idl,
  });

  if (!wallet) throw new Error("Not connected");
  if (!programId) throw new Error("Program ID not found");
  if (!idl) throw new Error("Anchor IDL not found");

  const provider = new AnchorProvider(
    connection,
    wallet,
    AnchorProvider.defaultOptions()
  );
  return new Program(idl, programId, provider);
};
