import { PgCommon, PgConnection, PgProgramInfo } from "../../utils";

/**
 * Automatically fetch the on-chain Anchor IDL when the user sets a custom
 * program id.
 *
 * This is limited to custom program ids because a program built in the
 * playground already gets its IDL from the build output. An existing IDL
 * (imported or built) is never overwritten.
 */
export const fetchIdl = () => {
  return PgCommon.batchChanges(async () => {
    const programId = PgProgramInfo.customPk;

    // Only fetch for a custom program id and never overwrite an existing IDL.
    if (!programId || PgProgramInfo.idl) return;

    try {
      const result = await PgProgramInfo.fetchIdl(programId);
      if (!result) return;

      // Bail if the state changed while fetching (the IDL was set or the
      // program id changed) so newer data is not overwritten.
      if (PgProgramInfo.idl || !PgProgramInfo.customPk?.equals(programId)) {
        return;
      }

      PgProgramInfo.update({ idl: result.idl });
    } catch {
      // Fetching can fail if the connection is not ready or the program has no
      // on-chain IDL. Ignore because this runs automatically in the background.
    }
  }, [PgProgramInfo.onDidChangeCustomPk, PgConnection.onDidChange]);
};
