import { PgCommon } from "../common";
import { PgTerminal } from "../terminal";
import type { Arrayable, Disposable, SyncOrAsync } from "../types";

/** Terminal command implementation */
export type CommandImpl<R> = {
  /** Name of the command that will be used in terminal */
  name: string;
  /** Description that will be seen in the `help` command */
  description: string;
  /** Function to run when the command is called */
  run: (input: string) => R;
  /* Only process the command if the condition passes */
  preCheck?: Arrayable<() => SyncOrAsync<void>>;
};

/** Command type for external usage */
type Command<R> = Pick<CommandImpl<R>, "name"> & {
  /** Command processor */
  run(args?: string): Promise<Awaited<R>>;
  /**
   * @param cb callback function to run when the command starts running
   * @returns a dispose function to clear the event
   */
  onDidRunStart(cb: (input: string | null) => void): Disposable;
  /**
   * @param cb callback function to run when the command finishes running
   * @returns a dispose function to clear the event
   */
  onDidRunFinish(cb: (result: Awaited<R>) => void): Disposable;
};

/** Ready to be used commands */
type Commands = {
  [N in keyof InternalCommands]: InternalCommands[N] extends CommandImpl<
    infer R
  >
    ? Command<R>
    : never;
};

/** All commands */
export const PgCommand: Commands = new Proxy(
  {},
  {
    get: (target: any, cmdName: CommandCodeName): Command<unknown> => {
      if (target[cmdName]) return target[cmdName];

      const commandName = PgCommandManager.commands[cmdName].name;
      target[cmdName] = {
        name: commandName,
        run: (args: string = "") => {
          return PgTerminal.executeFromStr(`${commandName} ${args}`, true);
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

/**
 * Terminal command manager.
 *
 * This is intended for internal usage. Running commands should be done with
 * `PgCommand` instead.
 */
export class PgCommandManager {
  /** Internal commands */
  static commands: InternalCommands;

  /**
   * Get the available command names.
   *
   * @returns the command names
   */
  static getNames() {
    return Object.values(PgCommandManager.commands).map((cmd) => cmd.name);
  }

  /**
   * Get the available command completions.
   *
   * @returns the command completions
   */
  static getCompletions() {
    const completes: Record<string, object> = {};
    for (const name of PgCommandManager.getNames()) completes[name] = {};
    return completes;
  }

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

      for (const cmdName in PgCommandManager.commands) {
        const cmd = PgCommandManager.commands[cmdName as CommandCodeName];
        if (inputCmdName !== cmd.name) continue;

        // Handle checks
        if (cmd.preCheck) {
          const preChecks = PgCommon.toArray(cmd.preCheck);
          for (const preCheck of preChecks) await preCheck();
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

      PgTerminal.log(
        `Command \`${PgTerminal.italic(inputCmdName)}\` not found.`
      );
    });
  }
}

/** Get custom event name for the given command. */
const getEventName = (name: string, kind: "start" | "finish") => {
  switch (kind) {
    case "start":
      return "ondidrunstart" + name;
    case "finish":
      return "ondidrunfinish" + name;
  }
};
