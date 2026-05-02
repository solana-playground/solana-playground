import { PgPackage } from "../../utils";
import { createCmd } from "../create";
import { checkPgWallet } from "../checks";

export const solana = createCmd({
  name: "solana",
  description: "Commands for interacting with Solana",
  preCheck: checkPgWallet,
  handle: async (input) => {
    const { runSolana } = await PgPackage.import("solana-cli", {
      log: true,
    });

    await runSolana(input.raw);
  },
});
