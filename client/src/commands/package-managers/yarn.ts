import { PgCommon, PgJsPackage, PgTerminal } from "../../utils";
import { createArgs, createCmd, createSubcmd } from "../create";

export const yarn = createCmd({
  name: "yarn",
  description: "Yarn package manager (v1)",
  subcommands: [
    // TODO: `init`

    createSubcmd({
      name: "install",
      description: "Install packages",
      handle: async () => {
        return await processCommon(["install"], {
          loading: "Installing",
          success: "Installation",
        });
      },
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
        return await processCommon(["add", ...input.args.packages], {
          loading: "Adding",
          success: "Addition",
        });
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
        return await processCommon(["remove", ...input.args.packages], {
          loading: "Removing",
          success: "Removal",
        });
      },
    }),

    createSubcmd({
      name: "upgrade",
      description: "Upgrade package(s) (also works with downgrades)",
      args: createArgs([
        {
          name: "packages",
          description: "Package(s) to upgrade",
          multiple: true,
        },
      ]),
      handle: async (input) => {
        return await processCommon(["upgrade", ...input.args.packages], {
          loading: "Upgrading",
          success: "Upgrade",
        });
      },
    }),
  ],
});

/**
 * Run process.
 *
 * @param cmd package manager command tokens
 * @param names names to print
 */
const processCommon = async (
  cmd: string[],
  names: { loading: string; success: string }
) => {
  PgTerminal.println(PgTerminal.info(`${names.loading}...`));
  const startTime = performance.now();
  await PgJsPackage.update(["yarn", ...cmd]);
  const timePassed = (performance.now() - startTime) / 1000;
  PgTerminal.println(
    `${PgTerminal.success(
      `${names.success} successful.`
    )} Completed in ${PgCommon.formatSeconds(timePassed)}.`
  );
};
