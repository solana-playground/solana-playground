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
  return opts;
};
