import type { Arg, CommandImpl, CommandInferredImpl } from "../utils/pg";

/**
 * Create a command.
 *
 * NOTE: This is only a type helper function.
 *
 * @param cmd command to create
 * @returns the command with its inferred type
 */
export const createCmd = <N extends string, A, S, R>(
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
export const createSubcmds = <N extends string, A, S, R>(
  ...cmd: CommandImpl<N, A, S, R>[]
) => {
  return cmd as CommandInferredImpl<N, A, S, R>[];
};

/**
 * Create command arguments.

 * NOTE: This is only a type helper function.
 *
 * @param arg arg to create
 * @returns the arg with its inferred type
 */
export const createArgs = <N extends string>(...arg: Arg<N>[]) => arg;
