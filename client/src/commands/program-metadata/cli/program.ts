import { PgTerminal } from "../../../utils";
import { setCommands } from "./commands";
import { setGlobalOptions } from "./options";
import { CustomCommand } from "./utils";

const __VERSION__ = "0.11.0-playground";

export const createProgram = () => {
  return new CustomCommand()
    .name("program-metadata")
    .description("CLI to manage Solana program metadata and IDLs")
    .version(__VERSION__)
    .configureHelp({ showGlobalOptions: true })
    .configureOutput({
      writeErr: PgTerminal.print,
      writeOut: PgTerminal.print,

      // No-op to avoid duplicating errors
      outputError: () => {},

      // The following 4 fix:
      //
      // ```
      // Cannot read properties of undefined (reading 'isTTY')
      // ```
      getOutHelpWidth: () => 80,
      getErrHelpWidth: () => 80,
      getOutHasColors: () => false,
      getErrHasColors: () => false,
    })
    .exitOverride()
    .tap(setGlobalOptions)
    .tap(setCommands);
};
