import { createArgs, createCmd, createOptions, createSubcmd } from "../create";
import { checkExperimentalUnstable, createHandler } from "./common";

export const yarn = createCmd({
  name: "yarn",
  description: "Yarn package manager (v1)",
  preChecks: checkExperimentalUnstable,
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
