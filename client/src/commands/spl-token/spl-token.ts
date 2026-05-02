import { PgPackage } from "../../utils";
import { createCmd } from "../create";
import { checkPgWallet } from "../checks";

export const splToken = createCmd({
  name: "spl-token",
  description: "Commands for interacting with SPL Tokens",
  preCheck: checkPgWallet,
  handle: async (input) => {
    const { runSplToken } = await PgPackage.import("spl-token-cli", {
      log: true,
    });

    await runSplToken(input.raw);
  },
});
