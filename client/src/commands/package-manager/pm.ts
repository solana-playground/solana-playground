import { PgCommon, PgJsPackage, PgTerminal } from "../../utils";
import { createArgs, createCmd, createSubcmd } from "../create";

// TODO: `npm`
// TODO: `pnpm`
export const pm = createCmd({
  name: "pm",
  description: "Manage packages",
  subcommands: [
    createSubcmd({
      // TODO: Alias
      name: "install",
      description: "Install packages",
      // TODO: Add the relevant manifest and lock file if non-existent (ask?)
      handle: () => processCommon("Installation", ["install"]),
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
      handle: async (input) => {
        await processCommon("Addition", ["add", ...input.args.packages]);
      },
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
      handle: async (input) => {
        await processCommon("Removal", ["remove", ...input.args.packages]);
      },
    }),

    createSubcmd({
      name: "update",
      description: "Update package(s)",
      args: createArgs([
        {
          name: "packages",
          description: "Package(s) to update",
          multiple: true,
        },
      ]),
      handle: async (input) => {
        await processCommon("Update", ["upgrade", ...input.args.packages]);
      },
    }),
  ],
});

/**
 * Run process.
 *
 * @param name process name
 * @param cmd package manager command tokens
 */
const processCommon = async (name: string, cmd: string[]) => {
  const startTime = performance.now();
  await PgJsPackage.install(["yarn", ...cmd]);
  const timePassed = (performance.now() - startTime) / 1000;
  PgTerminal.println(
    `${PgTerminal.success(
      `${name} successful.`
    )} Completed in ${PgCommon.formatSeconds(timePassed)}.`
  );
};
