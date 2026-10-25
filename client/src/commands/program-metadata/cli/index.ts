import type { OutputConfiguration } from "commander";

import * as platform from "./platform";
import { setCommands } from "./commands";
import { setGlobalOptions } from "./options";
import { CustomCommand } from "./utils";

const __VERSION__ = "0.11.0-playground";

export const run = async (
  args: string[],
  overrides?: {
    console?: platform.Console;
    fs?: platform.Fs;
    os: platform.Os;
    path?: platform.Path;
    outputConfig?: OutputConfiguration;
  }
) => {
  if (overrides) {
    if (overrides.console) platform.setConsole(overrides.console);
    if (overrides.fs) platform.setFs(overrides.fs);
    if (overrides.path) platform.setPath(overrides.path);
    if (overrides.os) platform.setOs(overrides.os);
  }

  const program = new CustomCommand()
    .name("program-metadata")
    .description("CLI to manage Solana program metadata and IDLs")
    .version(__VERSION__)
    .configureHelp({ showGlobalOptions: true })
    .configureOutput(overrides?.outputConfig ?? {})
    .exitOverride()
    .tap(setGlobalOptions)
    .tap(setCommands);

  try {
    await program.parseAsync(args.slice(1), { from: "user" });
  } catch (e: any) {
    switch (e?.code) {
      case "commander.help":
      case "commander.helpDisplayed":
      case "commander.version":
        // Not a real error; do nothing
        break;

      default:
        throw e;
    }
  }
};
