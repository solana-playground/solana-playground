import { PgCommandValidation, PgPackage } from "../../utils/pg";
import { createCmd } from "../create";

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
