import { PgPackage } from "../../utils/pg";
import { createCmd } from "../create";
import { isPgConnected } from "../validation";

export const splToken = createCmd({
  name: "spl-token",
  description: "Commands for interacting with SPL Tokens",
  run: async (input) => {
    const { runSplToken } = await PgPackage.import("spl-token-cli", {
      log: true,
    });

    await runSplToken(input.raw);
  },
  preCheck: isPgConnected,
});
