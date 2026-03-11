import type { Arg, CommandParam, Command, Option } from "../utils";

/**
 * Create a command.
 *
 * @param cmd command to create
 * @returns the command with its inferred type
 */
export const createCmd = <
  N extends string,
  A extends Arg[],
  O extends Option[],
  S,
  R
>(
  cmd: CommandParam<N, A, O, S, R>
) => {
  addHelpOption(cmd);
  return cmd as Command<N, A, O, S, R>;
};

/**
 * Create a subcommand.
 *
 * @param subcmd subcommand to create
 * @returns the command with its inferred type
 */
export const createSubcmd = <
  N extends string,
  A extends Arg[],
  O extends Option[],
  S,
  R
>(
  subcmd: CommandParam<N, A, O, S, R>
) => {
  addHelpOption(subcmd);
  return subcmd;
};

/**
 * Add built-in help option to the commands options list.
 *
 * @param cmd command or subcommand
 */
const addHelpOption = (cmd: { options?: Option[] }) => {
  cmd.options ??= [];
  cmd.options.push({ name: "help", short: "h" });
};

/**
 * Create command arguments.
 *
 * @param args args to create
 * @returns the args with their inferred types
 */
export const createArgs = <
  N extends string,
  V extends string,
  P,
  A extends Arg<N, V, P>[]
>(
  args: [...A]
) => {
  let isOptional;
  for (const arg of args) {
    if (isOptional && !arg.optional) {
      throw new Error("Optional arguments must come after required arguments");
    }
    if (arg.multiple && arg.name !== args.at(-1)!.name) {
      throw new Error("A multiple value argument must be the last argument");
    }

    if (arg.optional) isOptional = true;
  }

  return args;
};

/**
 * Create command options.
 *
 * @param opts options to create
 * @returns the options with their inferred types
 */
export const createOptions = <
  N extends string,
  V extends string,
  P,
  O extends Option<N, V, P>[]
>(
  opts: [...O]
) => {
  const createShort = (opt: O[number]) => {
    const short = typeof opt.short === "string" ? opt.short : opt.name[0];
    if (short.length !== 1) {
      throw new Error(`Short option must be exactly 1 letter: \`${opt.name}\``);
    }

    return short;
  };

  // Normalize shorts and verify uniqueness
  for (const opt of opts) {
    if (!opt.short) continue;

    const short = createShort(opt);
    const exists = opts
      .filter((o) => o.name !== opt.name)
      .some((o) => o.short && createShort(o) === short);
    if (exists) throw new Error(`Duplicate short option: \`${opt.name}\``);

    opt.short = short;
  }

  return opts;
};
