import { createCmd, PgCommandValidation, PgPackage } from "../../utils/pg";

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
