import { createCmd, PgTerminal } from "../../utils/pg";

export const runLastCmd = createCmd({
  name: "!!",
  description: "Run the last command",
  run: () => PgTerminal.runLastCmd(),
});
