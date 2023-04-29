import { PgCommandHelper } from "./__command";
import { CommandName, PgCommand } from "../command";
import { PgTerminal } from "../terminal";

export const help = PgCommandHelper.create({
  name: "help",
  description: "Print help message",
  process: () => {
    const fillWhitespace = (cmdLength: number) => {
      return new Array(25 - cmdLength).fill(" ").reduce((acc, v) => acc + v);
    };

    const helpMessage =
      "COMMANDS:\n" +
      Object.keys(PgCommand.COMMANDS).reduce((acc, cmdName) => {
        const cmd = PgCommand.COMMANDS[cmdName as CommandName];

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
