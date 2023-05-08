import { createCmd } from "./_command";
import { PgTerminal } from "../terminal";

export const runLastCmd = createCmd({
  name: "!!",
  description: "Run the last command",
  process: () => PgTerminal.runLastCmd(),
});
