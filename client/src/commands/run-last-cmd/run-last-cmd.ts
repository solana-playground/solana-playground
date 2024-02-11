import { PgTerminal } from "../../utils/pg";
import { createCmd } from "../create";

export const runLastCmd = createCmd({
  name: "!!",
  description: "Run the last command",
  run: () => PgTerminal.runLastCmd(),
});
