import { PgCommon, PgJsPackage, PgTerminal } from "../../utils";
import { createArgs, createCmd, createOptions, createSubcmd } from "../create";

export const yarn = createCmd({
  name: "yarn",
  description: "Yarn package manager (v1)",
  subcommands: [
    // TODO: `init`

    createSubcmd({
      name: "install",
      description: "Install packages",
      handle: createHandler({ loading: "Installing", success: "Installation" }),
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
      options: createOptions([
        {
          name: "dev",
          description: "Save package(s) to `devDependencies`",
          short: "D",
        },
        {
          name: "peer",
          description: "Save package(s) to `peerDependencies`",
          short: "P",
        },
        {
          name: "optional",
          description: "Save package(s) to `optionalDependencies`",
          short: "O",
        },
      ]),
      handle: createHandler({ loading: "Adding", success: "Addition" }),
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
      handle: createHandler({ loading: "Removing", success: "Removal" }),
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
      handle: createHandler({ loading: "Upgrading", success: "Upgrade" }),
    }),
  ],
});

/**
 * Create a `yarn` command handler.
 *
 * @param names names to print
 */
function createHandler(names: { loading: string; success: string }) {
  return async (input: { tokens: string[] }) => {
    PgTerminal.println(PgTerminal.info(`${names.loading}...`));
    const startTime = performance.now();
    await PgJsPackage.update(input.tokens);
    const timePassed = (performance.now() - startTime) / 1000;
    PgTerminal.println(
      `${PgTerminal.success(
        `${names.success} successful.`
      )} Completed in ${PgCommon.formatSeconds(timePassed)}.`
    );
  };
}
