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
  ...cmd: CommandImpl<N, A, O, S, R>[]
) => {
  return cmd as CommandInferredImpl<N, A, O, S, R>[];
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
export const createOptions = <N extends string, O extends Option<N>[]>(
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

  return opts;
};
