import { PgCommandHelper } from "./__command";
import { PgPkg, PkgName } from "../pkg";
import { PgWallet } from "../../wallet";

export const sugar = PgCommandHelper.create({
  name: "sugar",
  description:
    "Command line tool for creating and managing Metaplex Candy Machines",
  process: async (input) => {
    const { runSugar } = await PgPkg.loadPkg(PgPkg.SUGAR_CLI, {
      log: PgCommandHelper.isPkgLoadingInitial(PkgName.SUGAR_CLI),
    });

    await runSugar!(input);
  },
  preCheck: PgWallet.checkIsPgConnected,
});
