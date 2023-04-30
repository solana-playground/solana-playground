import { createCmd } from "./__command";
import { PgPackage } from "../package";
import { PgWallet } from "../../wallet";

export const solana = createCmd({
  name: "solana",
  description: "Commands for interacting with Solana",
  process: async (input) => {
    const { runSolana } = await PgPackage.import("solana-cli", {
      log: true,
    });

    await runSolana(input);
  },
  preCheck: PgWallet.checkIsPgConnected,
});
