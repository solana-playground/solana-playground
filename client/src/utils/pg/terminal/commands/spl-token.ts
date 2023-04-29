import { PgCommandHelper } from "./__command";
import { PgPkg, PkgName } from "../pkg";
import { PgWallet } from "../../wallet";

export const splToken = PgCommandHelper.create({
  name: "spl-token",
  description: "Commands for interacting with SPL Tokens",
  process: async (input) => {
    const { runSplToken } = await PgPkg.loadPkg(PgPkg.SPL_TOKEN_CLI, {
      log: PgCommandHelper.isPkgLoadingInitial(PkgName.SPL_TOKEN_CLI),
    });

    await runSplToken!(input);
  },
  preCheck: PgWallet.checkIsPgConnected,
});
