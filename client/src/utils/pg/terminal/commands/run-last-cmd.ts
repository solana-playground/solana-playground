import { PgCommandHelper } from "./__command";
import { PgTerminal } from "../terminal";

export const runLastCmd = PgCommandHelper.create({
  name: "!!",
  description: "Run the last command",
  process: PgTerminal.runLastCmd,
});
