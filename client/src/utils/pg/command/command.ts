import { PgCommon } from "../common";
import { PgTerminal } from "../terminal";

/** All commands */
export const PgCommand: Commands = new Proxy(
  {},
  {
    get: (target: any, cmdName: CommandCodeName): Command<unknown> => {
      if (target[cmdName]) return target[cmdName];

      const commandName = PgCommandExecutor.commands[cmdName].name;
      target[cmdName] = {
        name: commandName,
        run: (args: string = "") => {
          return PgTerminal.executeFromStr(`${commandName} ${args}`);
        },
        onDidRunStart: (cb: (input: string | null) => void) => {
          return PgCommon.onDidChange({
            cb,
            eventName: getEventName(cmdName, "start"),
          });
        },
        onDidRunFinish: (cb: (result: unknown) => void) => {
          return PgCommon.onDidChange({
            cb,
            eventName: getEventName(cmdName, "finish"),
          });
        },
      };

      return target[cmdName];
    },
  }
);

/** Get custom event name for the given command. */
const getEventName = (name: string, kind: "start" | "finish") => {
  switch (kind) {
    case "start":
      return "ondidrunstart" + name;
    case "finish":
      return "ondidrunfinish" + name;
  }
};

/**
 * Create a command. This is only a type helper function.
 *
 * @param cmd command to create
 * @returns the command with `Command` type
 */
export const createCmd = <R>(cmd: CommandImpl<R>): Readonly<CommandImpl<R>> => {
  return cmd;
};

/**
 * Command executor.
 *
 * This is intended for internal usage. Running commands should be done with
 * `PgCommand` instead.
 */
export class PgCommandExecutor {
  static commands: InternalCommands;

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
      input = input.trim();
      const inputCmdName = input.split(" ")?.at(0);
      if (!inputCmdName) return;

      for (const cmdName in PgCommandExecutor.commands) {
        const cmd = PgCommandExecutor.commands[cmdName as CommandCodeName];
        if (inputCmdName !== cmd.name) continue;

        // Handle checks
        if (cmd.preCheck) {
          const preChecks = PgCommon.toArray(cmd.preCheck);
          for (const preCheck of preChecks) {
            await preCheck();
          }
        }

        // Dispatch start event
        PgCommon.createAndDispatchCustomEvent(
          getEventName(cmdName, "start"),
          input
        );

        // Run the command processor
        const result = await cmd.run(input);

        // Dispatch finish event
        PgCommon.createAndDispatchCustomEvent(
          getEventName(cmdName, "finish"),
          result
        );

        return result;
      }

      PgTerminal.log(`Command '${PgTerminal.italic(input)}' not found.`);
    });
  }
}
