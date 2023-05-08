import { PgCommand } from "../command";
import { PgTerminal } from "../terminal";
import { PgWallet } from "../../wallet";

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

/** Common command checks */
export class PgCommandCheck {
  /** Check Playground Wallet connection */
  static isPgConnected() {
    const isConnected = PgWallet.isPgConnected();

    if (!isConnected) {
      PgTerminal.log(
        `${PgTerminal.bold(
          "Playground Wallet"
        )} must be connected to run this command. Run ${PgTerminal.bold(
          PgCommand.COMMANDS.connect.name
        )} to connect.`
      );
    }

    return isConnected;
  }
}
