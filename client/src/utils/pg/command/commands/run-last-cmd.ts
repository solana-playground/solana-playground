import { createCmd } from "../create-command";
import { PgTerminal } from "../../terminal";

export const runLastCmd = createCmd({
  name: "!!",
  description: "Run the last command",
  run: () => PgTerminal.runLastCmd(),
});
