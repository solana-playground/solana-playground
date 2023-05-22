import * as commands from "./";
import { createCmd } from "../create-command";
import { PgTerminal } from "../../terminal";

export const help = createCmd({
  name: "help",
  description: "Print help message",
  run: () => {
    const commandNames = Object.keys(commands) as Array<keyof typeof commands>;

    const helpMessage =
      "COMMANDS:\n" +
      commandNames
        .sort((a, b) => {
          // Put non-letter commands to the end
          if (!/^[a-zA-Z-]+$/.test(commands[b].name)) {
            return -1;
          }

          return a.localeCompare(b);
        })
        .reduce((acc, cmdName) => {
          const cmd = commands[cmdName];

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
