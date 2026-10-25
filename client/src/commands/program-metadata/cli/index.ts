import * as platform from "./platform";
import { createProgram } from "./program";

const program = createProgram();

export const run = async (
  args: string[],
  overrides?: {
    console?: platform.Console;
    fs?: platform.Fs;
    os: platform.Os;
    path?: platform.Path;
  }
) => {
  if (overrides) {
    if (overrides.console) platform.setConsole(overrides.console);
    if (overrides.fs) platform.setFs(overrides.fs);
    if (overrides.path) platform.setPath(overrides.path);
    if (overrides.os) platform.setOs(overrides.os);
  }

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
