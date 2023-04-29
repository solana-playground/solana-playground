import { PgCommandHelper } from "./__command";
import { PgPkg, PkgName } from "../pkg";
import { PgWallet } from "../../wallet";

export const solana = PgCommandHelper.create({
  name: "solana",
  description: "Commands for interacting with Solana",
  process: async (input) => {
    const { runSolana } = await PgPkg.loadPkg(PgPkg.SOLANA_CLI, {
      log: PgCommandHelper.isPkgLoadingInitial(PkgName.SOLANA_CLI),
    });

    await runSolana!(input);
  },
  preCheck: PgWallet.checkIsPgConnected,
});
