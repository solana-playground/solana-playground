import { PgCommandExecutor, PgCommon, PgTerminal } from "../../utils/pg";
import { createCmd } from "../create";

export const help = createCmd({
  name: "help",
  description: "Print help message",
  run: () => {
    const commandNames = PgCommon.keys(PgCommandExecutor.commands);

    const helpMessage =
      "COMMANDS:\n" +
      commandNames
        .sort((a, b) => {
          // Put non-letter commands to the end
          if (!/^[a-zA-Z-]+$/.test(PgCommandExecutor.commands[b].name)) {
            return -1;
          }

          return a.localeCompare(b);
        })
        .reduce((acc, cmdName) => {
          const cmd = PgCommandExecutor.commands[cmdName];

          return (
            acc +
            "    " +
            cmd.name +
            fillWhitespace(cmd.name.length) +
            cmd.description +
            "\n"
          );
        }, "");

    PgTerminal.log(helpMessage);
  },
});

const fillWhitespace = (cmdLength: number) => {
  return new Array(25 - cmdLength).fill(" ").reduce((acc, v) => acc + v);
};
