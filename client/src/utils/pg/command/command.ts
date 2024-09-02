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
  values?: Getable<V[]>;
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

      let cmd: CommandInferredImpl<string, Arg[], Option[], any[], any> =
        topCmd;
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
        if (!cmd.run) {
          PgTerminal.log(`
${cmd.description}

Usage: ${[...tokens.slice(0, +i), cmd.name].join(" ")} <COMMAND>

Commands:

${formatList(cmd.subcommands!)}`);
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
                formatList(cmd.subcommands)
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
                  (arg.values
                    ? ` (possible values: ${PgCommon.callIfNeeded(
                        arg.values
                      ).join(", ")})`
                    : ""),
              ]);
              lines.push(
                `${usagePrefix} ${usageArgs}`,
                "Arguments:",
                formatList(argList, { align: "y" })
              );
            }
            if (cmd.options) {
              const optList = cmd.options.map((opt) => [
                `${opt.short ? `-${opt.short}, ` : "    "}--${opt.name} ${
                  opt.takeValue ? `<${opt.name.toUpperCase()}>` : ""
                }`,
                opt.description ?? "",
              ]);
              lines.push("Options:", formatList(optList, { align: "y" }));
            }

            PgTerminal.log(lines.join("\n\n"));
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
              const values = PgCommon.callIfNeeded(arg.values);
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
export const formatList = (
  list: Array<string[] | { name: string; description?: string }>,
  opts?: { align?: "x" | "y" }
) => {
  const { align } = PgCommon.setDefault(opts, { align: "x" });
  return list
    .map((item) =>
      Array.isArray(item) ? item : [item.name, item.description ?? ""]
    )
    .sort((a, b) => {
      const allowedRegex = /^[a-zA-Z-]+$/;
      if (!allowedRegex.test(a[0])) return 1;
      if (!allowedRegex.test(b[0])) return -1;
      return a[0].localeCompare(b[0]);
    })
    .reduce((acc, items) => {
      const output = items.reduce((acc, col, i) => {
        const MAX_CHARS = 80;

        const chunks: string[][] = [];
        const words = col.split(" ");
        let j = 0;
        for (let i = 0; i < words.length; i++) {
          while (
            words[j] &&
            [...(chunks[i] ?? []), words[j]].join(" ").length <= MAX_CHARS
          ) {
            chunks[i] ??= [];
            chunks[i].push(words[j]);
            j++;
          }
        }

        if (align === "x") {
          const WHITESPACE_LEN = 24;
          return (
            acc +
            chunks.reduce(
              (acc, row, i) =>
                acc +
                (i ? "\n\t" + " ".repeat(WHITESPACE_LEN) : "") +
                row.join(" "),
              ""
            ) +
            " ".repeat(Math.max(WHITESPACE_LEN - col.length, 0))
          );
        }

        return (
          acc +
          (i ? "\n\t" : "") +
          chunks.reduce(
            (acc, row, i) => acc + (i ? "\n\t" : "") + row.join(" "),
            ""
          )
        );
      }, "");

      return acc + "\t" + output + "\n";
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
