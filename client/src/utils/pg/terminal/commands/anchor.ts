import { createCmd, PgCommandCheck } from "./_command";
import { PgPackage } from "../package";

export const anchor = createCmd({
  name: "anchor",
  description: "Anchor CLI",
  process: async (input) => {
    const { runAnchor } = await PgPackage.import("anchor-cli", {
      log: true,
    });

    await runAnchor(input);
  },
  preCheck: PgCommandCheck.isPgConnected,
});
