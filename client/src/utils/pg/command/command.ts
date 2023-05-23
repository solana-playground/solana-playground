import * as commands from "./commands";
import { PgTerminal } from "../terminal";

/** Terminal command */
export interface CommandImpl<R> {
  /** Name of the command */
  name: string;
  /** Description that will be seen in the `help` command */
  description: string;
  /** Function to run when the command is called */
  run: (input: string) => R;
  /* Only process the command if the condition passes */
  preCheck?: () => boolean;
}

/** All commands type */
type Commands = typeof commands;

/** Name of all the available commands(only code) */
type CommandCodeName = keyof Commands;

/** Ready to be used commands */
type CommandsReady = {
  [K in keyof Commands]: Commands[K] extends CommandImpl<infer R>
    ? Command<R>
    : never;
};

/** Command type for external usage */
type Command<R> = Pick<CommandImpl<R>, "name"> & {
  /** Command processor */
  run(args?: string): Promise<Awaited<R>>;
};

/** Command manager */
export const PgCommand: CommandsReady = new Proxy(
  {},
  {
    get: (_target: any, name: CommandCodeName): Command<unknown> => {
      return {
        name: commands[name].name,
        run(args: string = "") {
          return PgTerminal.executeFromStr(`${this.name} ${args}`);
        },
      };
    },
  }
);

/**
 * Command executor.
 *
 * This is intended for internal usage. Running commands should be done with
 * `PgCommand` instead.
 */
export class PgCommandExecutor {
  /**
   * Execute from the given input.
   *
   * All command processing logic happens in this method.
   *
   * @param input full user input starting with the command name
   * @returns the return value of the command
   */
  static async execute(input: string) {
    return await PgTerminal.process(async () => {
      // This guarantees commands only start with the specified command name.
      // `solana-keygen` would not count for inputCmdName === "solana"
      const inputCmdName = input.trim().split(" ")?.at(0);
      if (!inputCmdName) return;

      for (const cmdName in commands) {
        const cmd = commands[cmdName as CommandCodeName];
        if (inputCmdName !== cmd.name) continue;
        if (cmd.preCheck && !cmd.preCheck()) return;

        return await cmd.run(input);
      }

      PgTerminal.log(`Command '${PgTerminal.italic(input)}' not found.`);
    });
  }
}
