import type { CommandImpl } from "./command";

/**
 * Create a command. This is only a type helper function.
 *
 * @param cmd command to create
 * @returns the command with `Command` type
 */
export const createCmd = <R>(cmd: CommandImpl<R>): Readonly<CommandImpl<R>> =>
  cmd;
