import { createCmd, PgCommandCheck } from "./_command";
import { PgPackage } from "../package";

export const solana = createCmd({
  name: "solana",
  description: "Commands for interacting with Solana",
  process: async (input) => {
    const { runSolana } = await PgPackage.import("solana-cli", {
      log: true,
    });

    await runSolana(input);
  },
  preCheck: PgCommandCheck.isPgConnected,
});
