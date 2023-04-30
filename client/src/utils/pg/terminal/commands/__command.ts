/** Terminal command */
interface Command<R> {
  /** Name of the command */
  name: string;
  /** Description that will be seen in the `help` command */
  description: string;
  /** Function to run when the command is called */
  process: (input: string) => R;
  /* Only process the command if the condition passes */
  preCheck?: () => boolean;
}

/**
 * Create a command. This is only a type helper function.
 *
 * @param cmd command to create
 * @returns the command with `Command` type
 */
export const createCmd = <R>(cmd: Command<R>): Readonly<Command<R>> => cmd;
