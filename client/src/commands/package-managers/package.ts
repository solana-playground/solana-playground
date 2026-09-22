import { PgCommand } from "../../utils";
import { createArgs, createCmd, createOptions, createSubcmd } from "../create";

/**
 * Manage packages.
 *
 * Currently, this command is intended to be a wrapper that calls the configured
 * package manager (e.g. `yarn`), meaning this is a package-manager-agnostic way
 * of running package-related commands. Thus, the usage of this command should
 * be preferred over other package manager commands, especially in the playground
 * codebase.
 *
 * NOTE: The variable is named `packageManager` because `package` is a reserve
 * keyword. However, the user-facing command itself is still `package`.
 */
export const packageManager = createCmd({
  name: "package",
  description: "Manage packages",
  subcommands: [
    createSubcmd({
      // TODO: Alias
      name: "install",
      description: "Install packages",
      // TODO: Add the relevant manifest and lock file if non-existent (ask?)
      handle: proxy(),
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
          short: true,
        },
        {
          name: "peer",
          description: "Save package(s) to `peerDependencies`",
          short: true,
        },
        {
          name: "optional",
          description: "Save package(s) to `optionalDependencies`",
          short: true,
        },
      ]),
      handle: async (input) => {
        const packageManager = getPackageManager();
        const tokens = [];
        switch (packageManager) {
          case "yarn": {
            tokens.push("add");
            tokens.push(...input.args.packages);
            if (input.options.dev) tokens.push("--dev");
            if (input.options.peer) tokens.push("--peer");
            if (input.options.optional) tokens.push("--optional");
          }
        }

        return await PgCommand[packageManager].execute(...tokens);
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
      handle: proxy(),
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
      handle: proxy("upgrade"),
    }),
  ],
});

/**
 * Create a proxy handler with the configured package manager.
 *
 * @param args command argument tokens to pass
 * @returns the proxy handler
 */
function proxy(...args: string[]) {
  return async (input: { tokens: string[] }) => {
    const packageManager = getPackageManager();
    return await PgCommand[packageManager].execute(
      ...args,
      ...input.tokens.slice(1 + args.length)
    );
  };
}

// TODO: `npm`
// TODO: `pnpm`
/**
 * Get the configured package manager.
 *
 * @returns the configured package manager
 */
const getPackageManager = () => "yarn" as const;
