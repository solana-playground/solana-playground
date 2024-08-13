import { formatList, PgCommandManager, PgTerminal } from "../../utils/pg";
import { createCmd } from "../create";

export const help = createCmd({
  name: "help",
  description: "Print help message",
  run: () => {
    const cmds = Object.values(PgCommandManager.commands).map((cmd) => [
      cmd.name,
      cmd.description,
    ]);
    PgTerminal.log("Commands:\n\n" + formatList(cmds));
  },
});
