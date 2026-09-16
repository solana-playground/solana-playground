import { PgCommand } from "../../utils";
import { createArgs, createCmd, createSubcmd } from "../create";

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
    createSubcmd({
      name: "add",
      description: "Add package(s)",
      args: createArgs([
        {
          name: "packages",
          description: "Package(s) to add",
          multiple: true,
        },
      ]),
      handle: (input) => PgCommand.pm.execute(...input.tokens.slice(1)),
    }),
    // TODO: `remove`
    // TODO: `upgrade`
  ],
});
