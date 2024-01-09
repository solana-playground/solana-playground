import { createCmd, PgCommandValidation, PgPackage } from "../../utils/pg";

export const anchor = createCmd({
  name: "anchor",
  description: "Anchor CLI",
  run: async (input) => {
    const { runAnchor } = await PgPackage.import("anchor-cli", {
      log: true,
    });

    await runAnchor(input);
  },
  preCheck: PgCommandValidation.isPgConnected,
});
