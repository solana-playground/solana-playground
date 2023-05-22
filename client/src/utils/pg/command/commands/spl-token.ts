import { createCmd } from "../create-command";
import { PgPackage } from "../package";
import { PgCommandValidation } from "../validation";

export const splToken = createCmd({
  name: "spl-token",
  description: "Commands for interacting with SPL Tokens",
  run: async (input) => {
    const { runSplToken } = await PgPackage.import("spl-token-cli", {
      log: true,
    });

    await runSplToken(input);
  },
  preCheck: PgCommandValidation.isPgConnected,
});
