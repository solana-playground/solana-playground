import { PgCommon } from "./common";
import { PgTerminal } from "./terminal";
import type {
  Arrayable,
  Disposable,
  Getable,
  SyncOrAsync,
  ValueOf,
} from "./types";

/** Terminal command creation parameter */
export type CommandParam<
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
} & (WithSubcommands<S> | WithHandle<A, O, R>);

type WithSubcommands<S> = {
  /** Command arguments */
  args?: never;
  /** Command options */
  options?: never;
  /** Function to run when the command is called */
  handle?: never;
  /** Subcommands */
  subcommands?: S;
};

type WithHandle<A, O, R> = {
  /** Command arguments */
  args?: A;
  /** Command options */
  options?: O;
  /** Function to run when the command is called */
  handle: (input: ParsedInput<A, O>) => R;
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
  ? Head extends Arg<infer N, infer V>
    ? (Head["optional"] extends true
        ? { [K in N]?: Head["multiple"] extends true ? V[] : V }
        : { [K in N]: Head["multiple"] extends true ? V[] : V }) &
        ParsedArgs<Tail>
    : never
  : {};

/** Recursively map option types */
type ParsedOptions<O> = O extends [infer Head, ...infer Tail]
  ? Head extends Option<infer N, infer V>
    ? (Head["takeValue"] extends true
        ? { [K in N]?: V }
        : Head["values"] extends Getable<V[]>
        ? { [K in N]?: V }
        : { [K in N]?: boolean }) &
        ParsedOptions<Tail>
    : never
  : {};

/** Command argument */
export type Arg<N extends string = string, V extends string = string> = {
  /** Name of the argument */
  name: N;
  /** Description of the argument */
  description?: string;
  /** Whether the argument can be omitted */
  optional?: boolean;
  /** Whether to take multiple values */
  multiple?: boolean;
  /** Accepted values */
  values?: V[] | ((token: string, tokens: string[]) => V[]);
};

/** Command option */
export type Option<N extends string = string, V extends string = string> = {
  /** Name of the option */
  name: N;
  /** Description of the option */
  description?: string;
  /** Short form of the option passed with a single dash (`-`) */
  short?: boolean | string;
  /** Whether to take value for the option */
  takeValue?: boolean;
  /** Accepted values */
  values?: Getable<V[]>;
};

/** Inferred terminal command implementation */
export type Command<
  N extends string,
  A extends Arg[],
  O extends Option[],
  S,
  R
> = Omit<CommandParam<N, A, O, S, R>, "subcommands"> & {
  subcommands?: S extends Command<
    infer N2,
    infer A2,
    infer O2,
    infer S2,
    infer R2
  >
    ? Command<N2, A2, O2, S2, R2>
    : any[];
};

/** Executable command type for external usage */
type ExecutableCommand<
  N extends string = string,
  A extends Arg[] = Arg[],
  O extends Option[] = Option[],
  S = unknown,
  R = unknown
> = Pick<Command<N, A, O, S, R>, "name"> & {
  /** Process the command. */
  execute(...args: string[]): Promise<Awaited<R>>;
  /**
   * @param cb callback function to run when the command starts running
   * @returns a dispose function to clear the event
   */
  onDidStart(cb: (input: string | null) => void): Disposable;
  /**
   * @param cb callback function to run when the command finishes running
   * @returns a dispose function to clear the event
   */
  onDidFinish(cb: (result: Awaited<R>) => void): Disposable;
};

/** Name of all the available commands (only code) */
type CommandCodeName = keyof InternalCommands;

/** Ready to be used commands */
type Commands = {
  [N in CommandCodeName]: InternalCommands[N] extends Command<
    infer N,
    infer A,
    infer O,
    infer S,
    infer R
  >
    ? ExecutableCommand<N, A, O, S, R>
    : never;
};

/** All commands */
export const PgCommand: Commands = new Proxy({} as any, {
  get: (
    target: { [K in CommandCodeName]?: ExecutableCommand },
    cmdCodeName: CommandCodeName
  ) => {
    if (!target[cmdCodeName]) {
      const cmdUiName = PgCommandManager.all[cmdCodeName].name;
      target[cmdCodeName] = {
        name: cmdUiName,
        execute: (...args: string[]) => {
          return PgCommandManager.execute([cmdUiName, ...args]);
        },
        onDidStart: (cb: (input: string | null) => void) => {
          return PgCommon.onDidChange({
            cb,
            eventName: getEventName(cmdCodeName, "start"),
          });
        },
        onDidFinish: (cb: (result: unknown) => void) => {
          return PgCommon.onDidChange({
            cb,
            eventName: getEventName(cmdCodeName, "finish"),
          });
        },
      };
    }

    return target[cmdCodeName];
  },
});

/**
 * Terminal command manager.
 *
 * This is intended for internal usage. Running commands should be done with
 * `PgCommand` instead.
 */
export class PgCommandManager {
  /** All internal commands */
  static all: InternalCommands;

  /**
   * Get the available command names.
   *
   * @returns the command names
   */
  static getNames() {
    return Object.values(this.all).map((cmd) => cmd.name);
  }

  /**
   * Get the available command completions.
   *
   * @returns the command completions
   */
  static getCompletions() {
    type CompletionArg = { values?: Getable<string[]>; multiple?: boolean };
    type CompletionOption = { takeValue?: boolean; other?: string };
    interface Completions {
      [key: string]: Completions | CompletionArg | CompletionOption;
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
        }
        if (cmd.args) {
          for (const [i, arg] of Object.entries(cmd.args)) {
            completion[i] = { values: arg.values, multiple: arg.multiple };
          }
        }
        if (cmd.options) {
          for (const opt of cmd.options) {
            const long = `--${opt.name}`;
            completion[long] = { takeValue: opt.takeValue, values: opt.values };

            if (opt.short) {
              const short = `-${opt.short}`;
              completion[long] = { ...completion[long], other: short };
              completion[short] = {
                ...completion[long],
                other: long,
              };
            }
          }
        }
      }

      return completions;
    };

    return recursivelyGetCompletions(Object.values(PgCommandManager.all));
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

      const topCmd = Object.values(PgCommandManager.all).find(
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

      let cmd: Command<string, Arg[], Option[], any[], any> = topCmd;
      const args = [];
      const opts = [];

      for (const i in tokens) {
        const token = tokens[i];
        const nextIndex = +i + 1;
        const nextToken = tokens.at(nextIndex);
        const subcmd = cmd.subcommands?.find((cmd) => cmd.name === token);
        if (subcmd) cmd = subcmd;

        // Handle checks
        if (cmd.preCheck) {
          const preChecks = PgCommon.toArray(cmd.preCheck);
          for (const preCheck of preChecks) await preCheck();
        }

        // Early continue if it's not the end of the command
        const isLast = +i === tokens.length - 1;
        const isNextTokenSubcmd = cmd.subcommands?.some(
          (cmd) => cmd.name === nextToken
        );
        if (!isLast && isNextTokenSubcmd) continue;

        // Check missing command processor
        if (!cmd.handle) {
          PgTerminal.println(`
${cmd.description}

Usage: ${[...tokens.slice(0, +i), cmd.name].join(" ")} <COMMAND>

Commands:

${PgTerminal.formatList(cmd.subcommands!)}`);
          break;
        }

        const hasArgsOrOpts = cmd.args?.length || cmd.options!.length > 1;
        if (hasArgsOrOpts) {
          // Handle `help` option
          if (nextToken === "--help" || nextToken === "-h") {
            const usagePrefix = `Usage: ${[
              ...tokens.slice(0, +i),
              cmd.name,
            ].join(" ")} [OPTIONS]`;
            const lines = [cmd.description];
            if (cmd.subcommands) {
              lines.push(
                `${usagePrefix} <COMMAND>`,
                "Commands:",
                PgTerminal.formatList(cmd.subcommands)
              );
            }
            if (cmd.args) {
              const toArgStr = (arg: Arg) => {
                const name = arg.name.toUpperCase();
                return arg.multiple ? `[${name}]` : `<${name}>`;
              };

              const usageArgs = cmd.args.reduce(
                (acc, arg) => acc + toArgStr(arg) + " ",
                ""
              );
              const argList = cmd.args.map((arg) => [
                toArgStr(arg),
                (arg.description ?? "") +
                  (Array.isArray(arg.values)
                    ? ` (possible values: ${arg.values.join(", ")})`
                    : ""),
              ]);
              lines.push(
                `${usagePrefix} ${usageArgs}`,
                "Arguments:",
                PgTerminal.formatList(argList, { align: "y" })
              );
            }
            if (cmd.options) {
              const optList = cmd.options.map((opt) => [
                `${opt.short ? `-${opt.short}, ` : "    "}--${opt.name} ${
                  opt.takeValue ? `<${opt.name.toUpperCase()}>` : ""
                }`,
                opt.description ?? "",
              ]);
              lines.push(
                "Options:",
                PgTerminal.formatList(optList, { align: "y" })
              );
            }

            PgTerminal.println(lines.join("\n\n"));
            return;
          }

          // Get subcommands, args and options
          if (nextToken && !isNextTokenSubcmd) {
            let takeValue = false;
            for (const argOrOpt of tokens.slice(nextIndex)) {
              if (takeValue) {
                opts.push(argOrOpt);
                takeValue = false;
                continue;
              }

              const isOpt = argOrOpt.startsWith("-");
              if (isOpt && cmd.options) {
                const opt = cmd.options.find(
                  (o) =>
                    "--" + o.name === argOrOpt || "-" + o.short === argOrOpt
                );
                if (!opt) throw new Error(`Unexpected option: \`${argOrOpt}\``);

                opts.push(argOrOpt);
                if (opt.takeValue) takeValue = true;
              } else if (cmd.args) {
                args.push(argOrOpt);
              }
            }

            if (!cmd.args && cmd.subcommands) {
              if (nextToken.startsWith("-")) {
                throw new Error(`Unexpected option: \`${nextToken}\``);
              }

              throw new Error(
                `Subcommand doesn't exist: \`${nextToken}\`

Available subcommands: ${cmd.subcommands.map((cmd) => cmd.name).join(", ")}`
              );
            }
            if (
              args.length > (cmd.args?.length ?? 0) &&
              !cmd.args?.at(-1)?.multiple
            ) {
              throw new Error(
                `Provided argument count is higher than expected: ${args.length}`
              );
            }
          }
        }

        // Parse args
        const parsedArgs: Record<string, Arrayable<string>> = {};
        if (cmd.args) {
          for (const i in cmd.args) {
            const arg = cmd.args[i];
            const inputArgs = arg.multiple
              ? args.slice(+i)
              : args[i]
              ? [args[i]]
              : [];
            if (!inputArgs.length && !arg.optional) {
              throw new Error(`Argument not specified: \`${arg.name}\``);
            }

            // Validate values if specified
            if (inputArgs.length && arg.values) {
              const values =
                typeof arg.values === "function"
                  ? arg.values(args[i], tokens)
                  : arg.values;
              const invalidValue = inputArgs.find(
                (inputArg) => !values.includes(inputArg)
              );
              if (invalidValue) {
                throw new Error(
                  [
                    `Incorrect argument value given: \`${invalidValue}\``,
                    `(possible values: ${values.join(", ")})`,
                  ].join(" ")
                );
              }
            }

            parsedArgs[arg.name] = arg.multiple ? inputArgs : inputArgs[0];
          }
        }

        // Parse options
        const parsedOpts: Record<string, string | boolean> = {};
        if (cmd.options) {
          for (const opt of cmd.options) {
            const i = opts.findIndex(
              (o) => o === "--" + opt.name || o === "-" + opt.short
            );
            if (i === -1) continue;

            if (opt.takeValue) {
              const val = opts.at(i + 1);
              if (!val) {
                throw new Error(`Option value not given: \`${opt.name}\``);
              }

              // Validate values if specified
              if (opt.values) {
                const values = PgCommon.callIfNeeded(opt.values);
                if (!values.includes(val)) {
                  throw new Error(
                    [
                      `Incorrect option value given: \`${val}\``,
                      `(possible values: ${values.join(", ")})`,
                    ].join(" ")
                  );
                }
              }

              parsedOpts[opt.name] = val;
            } else {
              parsedOpts[opt.name] = true;
            }
          }
        }

        // Run the command processor
        const result = await cmd.handle({
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

/** Get custom event name for the given command. */
const getEventName = (name: string, kind: "start" | "finish") => {
  switch (kind) {
    case "start":
      return "ondidrunstart" + name;
    case "finish":
      return "ondidrunfinish" + name;
  }
};
