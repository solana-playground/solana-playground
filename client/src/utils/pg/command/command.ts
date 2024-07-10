import { PgCommon } from "../common";
import { PgTerminal } from "../terminal";
import type {
  Arrayable,
  Disposable,
  Getable,
  SyncOrAsync,
  ValueOf,
} from "../types";

/** Terminal command implementation */
export type CommandImpl<
  N extends string,
  A extends Arg[],
  O extends Option[],
  S,
  R
> = {
  /** Name of the command that will be used in terminal */
  name: N;
  /** Description that will be seen in the `help` command */
  description: string;
  /* Only process the command if the condition passes */
  preCheck?: Arrayable<() => SyncOrAsync<void>>;
} & (WithSubcommands<S> | WithRun<A, O, R>);

type WithSubcommands<S> = {
  /** Command arguments */
  args?: never;
  /** Command options */
  options?: never;
  /** Function to run when the command is called */
  run?: never;
  /** Subcommands */
  subcommands?: S;
};

type WithRun<A, O, R> = {
  /** Command arguments */
  args?: A;
  /** Command options */
  options?: O;
  /** Function to run when the command is called */
  run: (input: ParsedInput<A, O>) => R;
  /** Subcommands */
  subcommands?: never;
};

type ParsedInput<A, O> = {
  /** Raw input */
  raw: string;
  /** Parsed arguments */
  args: ParsedArgs<A>;
  /** Parsed options */
  options: ParsedOptions<O>;
};

/** Recursively map argument types */
type ParsedArgs<A> = A extends [infer Head, ...infer Tail]
  ? Head extends Arg<infer N, infer O, infer V>
    ? (O extends true ? { [K in N]?: V } : { [K in N]: V }) & ParsedArgs<Tail>
    : never
  : {};

/** Recursively map option types */
type ParsedOptions<O> = O extends [infer Head, ...infer Tail]
  ? Head extends Option<infer N>
    ? { [K in N]?: boolean } & ParsedOptions<Tail>
    : never
  : {};

/** Command argument */
export type Arg<
  N extends string = string,
  O = boolean,
  V extends string = string
> = {
  /** Name of the argument */
  name: N;
  /** Whether the argument can be omitted */
  optional?: O;
  /** Accepted values */
  values?: Getable<V[]>;
};

/** Command option */
export type Option<N extends string = string> = {
  /** Name of the option */
  name: N;
};

/** Terminal command inferred implementation */
export type CommandInferredImpl<
  N extends string,
  A extends Arg[],
  O extends Option[],
  S,
  R
> = Omit<CommandImpl<N, A, O, S, R>, "subcommands"> & {
  subcommands?: S extends CommandInferredImpl<
    infer N2,
    infer A2,
    infer O2,
    infer S2,
    infer R2
  >
    ? CommandInferredImpl<N2, A2, O2, S2, R2>
    : any[];
};

/** Command type for external usage */
type Command<
  N extends string,
  A extends Arg[],
  O extends Option[],
  S,
  R
> = Pick<CommandInferredImpl<N, A, O, S, R>, "name"> & {
  /** Process the command. */
  run(...args: string[]): Promise<Awaited<R>>;
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

/** Name of all the available commands (only code) */
type CommandCodeName = keyof InternalCommands;

/** Ready to be used commands */
type Commands = {
  [N in keyof InternalCommands]: InternalCommands[N] extends CommandInferredImpl<
    infer N,
    infer A,
    infer O,
    infer S,
    infer R
  >
    ? Command<N, A, O, S, R>
    : never;
};

/** All commands */
export const PgCommand: Commands = new Proxy(
  {},
  {
    get: (
      target: any,
      cmdCodeName: CommandCodeName
    ): Command<string, Arg[], Option[], unknown, unknown> => {
      if (!target[cmdCodeName]) {
        const cmdUiName = PgCommandManager.commands[cmdCodeName].name;
        target[cmdCodeName] = {
          name: cmdUiName,
          run: (...args: string[]) => {
            return PgCommandManager.execute([cmdUiName, ...args]);
          },
          onDidRunStart: (cb: (input: string | null) => void) => {
            return PgCommon.onDidChange({
              cb,
              eventName: getEventName(cmdCodeName, "start"),
            });
          },
          onDidRunFinish: (cb: (result: unknown) => void) => {
            return PgCommon.onDidChange({
              cb,
              eventName: getEventName(cmdCodeName, "finish"),
            });
          },
        };
      }

      return target[cmdCodeName];
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
    interface Completions {
      [key: string]: Completions | Getable<string[]>;
    }
    const recursivelyGetCompletions = (
      commands: ValueOf<InternalCommands>[],
      completions: Completions = {}
    ) => {
      for (const cmd of commands) {
        completions[cmd.name] = {};
        const completion = completions[cmd.name] as Completions;
        if (cmd.subcommands) {
          recursivelyGetCompletions(cmd.subcommands, completion);
        } else {
          if (cmd.args) {
            for (const [i, arg] of Object.entries(cmd.args)) {
              if (arg.values) completion[i] = arg.values;
            }
          }
          if (cmd.options) {
            for (const opt of cmd.options) {
              completion[`--${opt.name}`] = {};
            }
          }
        }
      }

      return completions;
    };
    return recursivelyGetCompletions(Object.values(PgCommandManager.commands));
  }

  /**
   * Execute from the given tokens.
   *
   * All command processing logic happens in this method.
   *
   * @param tokens parsed input tokens
   * @returns the return value of the command
   */
  static async execute(tokens: string[]) {
    return await PgTerminal.process(async () => {
      const inputCmdName = tokens.at(0);
      if (!inputCmdName) return;

      const topCmd = Object.values(PgCommandManager.commands).find(
        (cmd) => cmd.name === inputCmdName
      );
      if (!topCmd) {
        throw new Error(
          `Command \`${PgTerminal.italic(inputCmdName)}\` not found.`
        );
      }

      // Dispatch start event
      const input = tokens.join(" ");
      PgCommon.createAndDispatchCustomEvent(
        getEventName(topCmd.name, "start"),
        input
      );

      let cmd = topCmd;
      const args = [];
      const opts = [];

      for (const i in tokens) {
        // Get subcommand
        const token = tokens[i];
        const nextToken = tokens[+i + 1];

        const subCmd = cmd.subcommands?.find((cmd) => cmd.name === token);
        if (subCmd) cmd = subCmd;
        if (nextToken) {
          const isNextTokenSubcommand = cmd.subcommands?.some(
            (cmd) => cmd.name === nextToken
          );
          if (!isNextTokenSubcommand) {
            for (const argOrOpt of tokens.slice(+i + 1)) {
              const isOpt = argOrOpt.startsWith("-");
              if (isOpt) opts.push(argOrOpt);
              else args.push(argOrOpt);
            }

            if (!cmd.args && cmd.subcommands) {
              throw new Error(
                `Subcommand doesn't exist: \`${nextToken}\`

Available subcommands: ${cmd.subcommands.map((cmd) => cmd.name).join(", ")}`
              );
            }
            if (cmd.args?.length && args.length > cmd.args.length) {
              throw new Error(
                `Provided argument count is higher than expected: ${args.length}`
              );
            }
          }
        }

        // Handle checks
        if (cmd.preCheck) {
          const preChecks = PgCommon.toArray(cmd.preCheck);
          for (const preCheck of preChecks) await preCheck();
        }

        // Early continue if it's not the end of the command
        const isLast = +i === tokens.length - 1;
        if (!isLast && !args.length) continue;

        // Check missing command processor
        if (!cmd.run) {
          PgTerminal.log(`
${cmd.description}

Usage: ${[...tokens.slice(0, +i), cmd.name].join(" ")} <COMMAND>

Commands:

${formatCmdList(cmd.subcommands!)}`);
          break;
        }

        // Parse args
        const parsedArgs: Record<string, string> = {};
        if (cmd.args) {
          for (const i in cmd.args) {
            const arg = cmd.args[i];
            const inputArg = args[i];
            if (!inputArg && !arg.optional) {
              throw new Error(`Argument not specified: \`${arg.name}\``);
            }

            parsedArgs[arg.name] = inputArg;
          }
        }

        // Parse options
        const parsedOpts: Record<string, boolean> = {};
        if (cmd.options) {
          for (const opt of cmd.options) {
            const inputOpt = opts.some((o) => o === "--" + opt.name);
            if (inputOpt) parsedOpts[opt.name] = inputOpt;
          }
        }

        // Run the command processor
        const result = await cmd.run({
          raw: input,
          args: parsedArgs,
          options: parsedOpts,
        });

        // Dispatch finish event
        PgCommon.createAndDispatchCustomEvent(
          getEventName(topCmd.name, "finish"),
          result
        );

        return result;
      }
    });
  }
}

/**
 * Format the given list for terminal view.
 *
 * @param list list to format
 * @returns the formatted list
 */
export const formatCmdList = (
  list: Array<{ name: string; description: string }>
) => {
  return list
    .sort((a, b) => {
      // Put non-letter commands to the end
      if (!/^[a-zA-Z-]+$/.test(b.name)) {
        return -1;
      }

      return a.name.localeCompare(b.name);
    })
    .reduce((acc, cmd) => {
      return (
        acc +
        "    " +
        cmd.name +
        new Array(25 - cmd.name.length).fill(" ").reduce((acc, v) => acc + v) +
        cmd.description +
        "\n"
      );
    }, "");
};

/** Get custom event name for the given command. */
const getEventName = (name: string, kind: "start" | "finish") => {
  switch (kind) {
    case "start":
      return "ondidrunstart" + name;
    case "finish":
      return "ondidrunfinish" + name;
  }
};
