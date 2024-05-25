import type { CommandImpl } from "../utils/pg";

/**
 * Create a command. This is only a type helper function.
 *
 * @param cmd command to create
 * @returns the command with `CommandImpl` type
 */
export const createCmd = <R>(cmd: CommandImpl<R>): Readonly<CommandImpl<R>> => {
  return cmd;
};
