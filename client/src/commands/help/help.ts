import { PgCommandManager, PgTerminal } from "../../utils/pg";
import { createCmd } from "../create";

export const help = createCmd({
  name: "help",
  description: "Print help message",
  handle: () => {
    const cmds = Object.values(PgCommandManager.all);
    PgTerminal.println("Commands:\n\n" + PgTerminal.formatList(cmds));
  },
});
