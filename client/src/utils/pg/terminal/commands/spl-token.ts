import { createCmd, PgCommandCheck } from "./_command";
import { PgPackage } from "../package";

export const splToken = createCmd({
  name: "spl-token",
  description: "Commands for interacting with SPL Tokens",
  process: async (input) => {
    const { runSplToken } = await PgPackage.import("spl-token-cli", {
      log: true,
    });

    await runSplToken(input);
  },
  preCheck: PgCommandCheck.isPgConnected,
});
