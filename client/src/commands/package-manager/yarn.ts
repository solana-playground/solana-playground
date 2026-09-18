import { PgCommand } from "../../utils";
import { createArgs, createCmd, createSubcmd } from "../create";

export const yarn = createCmd({
  name: "yarn",
  description: "Yarn package manager (v1)",
  subcommands: [
    // TODO: `init`

    createSubcmd({
      name: "install",
      description: "Install packages",
      handle: proxyPm(),
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
      handle: proxyPm(),
    }),

    createSubcmd({
      name: "remove",
      description: "Remove package(s)",
      args: createArgs([
        {
          name: "packages",
          description: "Package(s) to remove",
          multiple: true,
        },
      ]),
      handle: proxyPm(),
    }),

    createSubcmd({
      name: "upgrade",
      description: "Upgrade package(s)",
      args: createArgs([
        {
          name: "packages",
          description: "Package(s) to upgrade",
          multiple: true,
        },
      ]),
      handle: proxyPm("update"),
    }),
  ],
});

/**
 * Create a `pm` proxy handler.
 *
 * @param args command argument tokens to pass
 * @returns the `pm` proxy handler
 */
function proxyPm(...args: string[]) {
  return async (input: { tokens: string[] }) => {
    return await PgCommand.pm.execute(
      ...args,
      ...input.tokens.slice(1 + args.length)
    );
  };
}
