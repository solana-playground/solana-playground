import { PgPackage } from "../../utils";
import { createCmd } from "../create";
import { checkPgWallet } from "../checks";

export const anchor = createCmd({
  name: "anchor",
  description: "Anchor CLI",
  preCheck: checkPgWallet,
  handle: async (input) => {
    const { runAnchor } = await PgPackage.import("anchor-cli", {
      log: true,
    });

    await runAnchor(input.raw);
  },
});
