import * as commands from "./commands";
import { PgTerminal } from "./terminal";

/** All commands type */
export type Commands = typeof PgCommand["COMMANDS"];

/** Name of all the available commands(only code) */
export type CommandName = keyof Commands;

/** Static class for command related utilities */
export class PgCommand {
  /** All commands */
  static readonly COMMANDS = commands;

  /** Execute the given command */
  static async execute(input: string) {
    return await PgTerminal.process(async () => {
      // This guarantees commands only start with the specified command name.
      // solana-keygen would not count for inputCmdName === "solana"
      const inputCmdName = input.trim().split(" ")?.at(0);
      if (!inputCmdName) return;

      for (const cmdName in this.COMMANDS) {
        const cmd = this.COMMANDS[cmdName as CommandName];
        if (inputCmdName !== cmd.name) continue;
        if (cmd.preCheck && !cmd.preCheck()) return;

        return await cmd.process(input);
      }

      PgTerminal.log(`Command '${PgTerminal.italic(input)}' not found.`);
    });
  }
}
