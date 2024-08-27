import type {
  Arg,
  CommandImpl,
  CommandInferredImpl,
  Option,
} from "../utils/pg";

/**
 * Create a command.
 *
 * NOTE: This is only a type helper function.
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
  cmd: CommandImpl<N, A, O, S, R>
) => {
  addHelpOption(cmd);
  return cmd as CommandInferredImpl<N, A, O, S, R>;
};

/**
 * Create subcommands.
 *
 * NOTE: This is only a type helper function.
 *
 * @param cmd command to create
 * @returns the command with its inferred type
 */
export const createSubcmds = <
  N extends string,
  A extends Arg[],
  O extends Option[],
  S,
  R
>(
  ...subcmds: CommandImpl<N, A, O, S, R>[]
) => {
  for (const subcmd of subcmds) addHelpOption(subcmd);
  return subcmds as CommandInferredImpl<N, A, O, S, R>[];
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
 * @param arg arg to create
 * @returns the args with their inferred types
 */
export const createArgs = <
  N extends string,
  V extends string,
  A extends Arg<N, V>[]
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
 * @param opts option to create
 * @returns the options with their inferred types
 */
export const createOptions = <
  N extends string,
  V extends string,
  O extends Option<N, V>[]
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
      .some((o) => createShort(o) === short);
    if (exists) throw new Error(`Duplicate short option: \`${opt.name}\``);

    opt.short = short;
  }

  // If `values` field is specified, it implies `takeValue`
  for (const opt of opts) opt.takeValue ??= !!opt.values;

  return opts;
};
