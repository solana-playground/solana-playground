import { PgCommon, PgFramework, PgProgramInfo, PgTerminal } from "../../utils";

/**
 * Automatically fetch the on-chain Anchor IDL of the current program.
 *
 * This runs when the program is deployed and there is no IDL available
 * locally, e.g. when interacting with a pre-deployed program via a custom
 * program id or an imported keypair. An existing IDL (imported or built) is
 * never overwritten.
 */
export const fetchIdl = () => {
  return PgCommon.batchChanges(async () => {
    const programId = PgProgramInfo.pk;

    // Only fetch when the program is deployed and there is no local IDL.
    if (!programId || PgProgramInfo.idl || !PgProgramInfo.onChain?.deployed) {
      return;
    }

    // TODO: Remove once `PgProgramInfo.fetchIdl` is framework-agnostic
    // (Seahorse programs are Anchor-compatible and also have Anchor IDLs)
    const framework = await PgFramework.getFromFiles();
    if (framework?.name !== "Anchor" && framework?.name !== "Seahorse") return;

    try {
      const result = await PgProgramInfo.fetchIdl(programId);
      if (!result) return;

      // Bail if the state changed while fetching (the IDL was set or the
      // program id changed) so newer data is not overwritten.
      if (PgProgramInfo.idl || !PgProgramInfo.pk?.equals(programId)) return;

      PgProgramInfo.update({ idl: result.idl });
      PgTerminal.println(PgTerminal.success("Fetched the on-chain IDL."));
    } catch {
      // Fetching can fail for various reasons, e.g. the connection not being
      // ready or the request getting rate-limited. Ignore because this runs
      // automatically in the background.
    }
  }, [PgProgramInfo.onDidChangePk, PgProgramInfo.onDidChangeOnChain]);
};
