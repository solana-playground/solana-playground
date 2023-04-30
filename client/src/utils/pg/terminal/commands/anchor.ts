import { createCmd } from "./__command";
import { PgPackage } from "../package";
import { PgWallet } from "../../wallet";

export const anchor = createCmd({
  name: "anchor",
  description: "Anchor CLI",
  process: async (input) => {
    const { runAnchor } = await PgPackage.import("anchor-cli", {
      log: true,
    });

    await runAnchor(input);
  },
  preCheck: PgWallet.checkIsPgConnected,
});
