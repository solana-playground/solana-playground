import { createCmd } from "../../create-command";
import { PgPackage } from "../../package";
import { PgCommandValidation } from "../../validation";

export const sugar = createCmd({
  name: "sugar",
  description:
    "Command line tool for creating and managing Metaplex Candy Machines",
  run: async (input) => {
    const { runSugar } = await PgPackage.import("sugar-cli", {
      log: true,
    });

    await runSugar(input);
  },
  preCheck: PgCommandValidation.isPgConnected,
});
