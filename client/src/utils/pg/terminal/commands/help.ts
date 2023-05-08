import { createCmd } from "./_command";
import { CommandName, PgCommand } from "../command";
import { PgTerminal } from "../terminal";

export const help = createCmd({
  name: "help",
  description: "Print help message",
  process: () => {
    const commandNames = Object.keys(PgCommand.COMMANDS) as CommandName[];

    const helpMessage =
      "COMMANDS:\n" +
      commandNames
        .sort((a, b) => {
          // Put non-letter commands to the end
          if (!/^[a-zA-Z-]+$/.test(PgCommand.COMMANDS[b].name)) {
            return -1;
          }

          return a.localeCompare(b);
        })
        .reduce((acc, cmdName) => {
          const cmd = PgCommand.COMMANDS[cmdName];

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
