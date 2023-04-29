import { PgCommandHelper } from "./__command";
import { PgPkg, PkgName } from "../pkg";
import { PgWallet } from "../../wallet";

export const anchor = PgCommandHelper.create({
  name: "anchor",
  description: "Anchor CLI",
  process: async (input) => {
    const { runAnchor } = await PgPkg.loadPkg(PgPkg.ANCHOR_CLI, {
      log: PgCommandHelper.isPkgLoadingInitial(PkgName.ANCHOR_CLI),
    });

    await runAnchor!(input);
  },
  preCheck: PgWallet.checkIsPgConnected,
});
