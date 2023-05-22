import { createCmd } from "../create-command";
import { PgPackage } from "../package";
import { PgCommandValidation } from "../validation";

export const solana = createCmd({
  name: "solana",
  description: "Commands for interacting with Solana",
  run: async (input) => {
    const { runSolana } = await PgPackage.import("solana-cli", {
      log: true,
    });

    await runSolana(input);
  },
  preCheck: PgCommandValidation.isPgConnected,
});
