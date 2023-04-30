import { createCmd } from "./__command";
import { PgWallet } from "../../wallet";
import { PgPackage } from "../package";

export const sugar = createCmd({
  name: "sugar",
  description:
    "Command line tool for creating and managing Metaplex Candy Machines",
  process: async (input) => {
    const { runSugar } = await PgPackage.import("sugar-cli", {
      log: true,
    });

    await runSugar(input);
  },
  preCheck: PgWallet.checkIsPgConnected,
});
