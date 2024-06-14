import type { Arg, CommandImpl, CommandInferredImpl } from "../utils/pg";

/**
 * Create a command.
 *
 * NOTE: This is only a type helper function.
 *
 * @param cmd command to create
 * @returns the command with its inferred type
 */
export const createCmd = <N extends string, A extends Arg[], S, R>(
  cmd: CommandImpl<N, A, S, R>
) => {
  return cmd as CommandInferredImpl<N, A, S, R>;
};

/**
 * Create subcommands.
 *
 * NOTE: This is only a type helper function.
 *
 * @param cmd command to create
 * @returns the command with its inferred type
 */
export const createSubcmds = <N extends string, A extends Arg[], S, R>(
  ...cmd: CommandImpl<N, A, S, R>[]
) => {
  return cmd as CommandInferredImpl<N, A, S, R>[];
};

/**
 * Create command arguments.
 *
 * @param arg arg to create
 * @returns the args with their inferred types
 */
export const createArgs = <
  N extends string,
  O extends boolean,
  V extends string,
  A extends Arg<N, O, V>[]
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
