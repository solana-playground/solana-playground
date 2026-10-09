import { createArgs, createCmd, createOptions, createSubcmd } from "../create";
import { createHandler } from "./common";

export const npm = createCmd({
  name: "npm",
  description: "Node Package Manager",
  subcommands: [
    // TODO: `init`

    createSubcmd({
      name: "install",
      // TODO: Alias
      description: "Install packages",
      args: createArgs([
        {
          name: "packages",
          description: "Package(s) to add",
          optional: true,
          multiple: true,
        },
      ]),
      options: createOptions([
        {
          name: "save-dev",
          description: "Save package(s) to `devDependencies`",
          short: "D",
        },
        {
          name: "save-peer",
          description: "Save package(s) to `peerDependencies`",
        },
        {
          name: "save-optional",
          description: "Save package(s) to `optionalDependencies`",
          short: "O",
        },
      ]),
      handle: createHandler({ loading: "Installing", success: "Installation" }),
    }),

    createSubcmd({
      name: "uninstall",
      // TODO: Alias
      description: "Uninstall package(s)",
      args: createArgs([
        {
          name: "packages",
          description: "Package(s) to remove",
          multiple: true,
        },
      ]),
      handle: createHandler({ loading: "Uninstalling", success: "Uninstall" }),
    }),

    createSubcmd({
      name: "update",
      // TODO: Alias
      description: "Update package(s)",
      args: createArgs([
        {
          name: "packages",
          description: "Package(s) to update",
          multiple: true,
        },
      ]),
      handle: createHandler({ loading: "Updating", success: "Update" }),
    }),
  ],
});
