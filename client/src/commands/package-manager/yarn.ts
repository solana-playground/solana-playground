import { PgCommand } from "../../utils";
import { createCmd, createSubcmd } from "../create";

export const yarn = createCmd({
  name: "yarn",
  description: "Yarn package manager (v1)",
  subcommands: [
    createSubcmd({
      name: "install",
      description: "Install packages",
      // FIXME: If the command fails, it prints the error twice (in the terminal)
      handle: (input) => PgCommand.pm.execute(...input.tokens.slice(1)),
    }),
    // TODO: `add`
    // TODO: `remove`
    // TODO: `upgrade`
  ],
});
