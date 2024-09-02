import { PgPackage } from "../../utils/pg";
import { createCmd } from "../create";
import { isPgConnected } from "../validation";

export const anchor = createCmd({
  name: "anchor",
  description: "Anchor CLI",
  run: async (input) => {
    const { runAnchor } = await PgPackage.import("anchor-cli", {
      log: true,
    });

    await runAnchor(input.raw);
  },
  preCheck: isPgConnected,
});
