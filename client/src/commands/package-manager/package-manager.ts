import { PgJsPackage, PgTerminal } from "../../utils";
import { createCmd, createSubcmd } from "../create";

// TODO: `yarn`
// TODO: `npm`
// TODO: `pnpm`
export const packageManager = createCmd({
  name: "pm",
  description: "Manage packages",
  subcommands: [
    createSubcmd({
      // TODO: Alias
      name: "install",
      description: "Install packages",
      handle: async () => {
        await PgJsPackage.install();
        PgTerminal.println(PgTerminal.success("Installation successful."));
      },
    }),
  ],
});
