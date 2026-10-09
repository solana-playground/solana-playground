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
      handle: async (input) => {
        const packageManager = getPackageManager();
        const tokens = input.tokens.slice(1);
        return await PgCommand[packageManager].execute(...tokens);
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
          case "npm": {
            tokens.push("install", ...input.args.packages);
            if (input.options.dev) tokens.push("--save-dev");
            if (input.options.peer) tokens.push("--save-peer");
            if (input.options.optional) tokens.push("--save-optional");
            break;
          }
          case "yarn": {
            tokens.push("add", ...input.args.packages);
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
      handle: async (input) => {
        const packageManager = getPackageManager();
        const tokens = [];
        switch (packageManager) {
          case "npm": {
            tokens.push("uninstall", ...input.tokens.slice(2));
            break;
          }
          case "yarn": {
            tokens.push(...input.tokens.slice(1));
          }
        }

        return await PgCommand[packageManager].execute(...tokens);
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
        const packageManager = getPackageManager();
        const tokens = [];
        switch (packageManager) {
          case "npm": {
            tokens.push(...input.tokens.slice(1));
            break;
          }
          case "yarn": {
            tokens.push("upgrade", ...input.tokens.slice(2));
          }
        }

        return await PgCommand[packageManager].execute(...tokens);
      },
    }),
  ],
});

// TODO: `pnpm`
/**
 * Get the configured package manager.
 *
 * @returns the configured package manager
 */
const getPackageManager = () => {
  // TODO: Actual impl
  const packageManager = "npm" as string;
  switch (packageManager) {
    case "yarn":
      return "yarn" as const;
    default:
      return "npm" as const;
  }
};
