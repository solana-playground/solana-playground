import { PgCommon, PgJsPackage, PgTerminal } from "../../utils";
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
        const startTime = performance.now();
        await PgJsPackage.install();
        const timePassed = (performance.now() - startTime) / 1000;
        PgTerminal.println(
          `${PgTerminal.success(
            "Installation successful."
          )} Completed in ${PgCommon.formatSeconds(timePassed)}.`
        );
      },
    }),
  ],
});
