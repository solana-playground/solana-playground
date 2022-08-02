import { PgConnection } from "../connection";
import { PgWallet } from "../wallet";
import { PkgName } from "./pkg";

export class PgCommand {
  static readonly BUILD = "build";
  static readonly CLEAR = "clear";
  static readonly CONNECT = "connect";
  static readonly DEPLOY = "deploy";
  static readonly HELP = "help";
  static readonly SOLANA = "solana";
  static readonly SPL_TOKEN = "spl-token";
  static readonly RUN_LAST_CMD = "!!";

  /**
   * @returns help command output
   */
  static help() {
    const commandsText = "COMMANDS:\n";
    const indent = "    ";

    const fillWhitespace = (cmdLength: number) => {
      return new Array(25 - cmdLength).fill(" ").reduce((acc, v) => acc + v);
    };

    return (
      commandsText +
      COMMANDS.reduce(
        (acc, cmd) =>
          acc +
          indent +
          cmd.name +
          fillWhitespace(cmd.name.length) +
          cmd.description +
          "\n",
        ""
      )
    );
  }

  /**
   * Get the remaining args for the command
   *
   * - Solana: (endpoint: string, commitment: string, keypairBytes: Uint8Array)
   * - SPL-Token: (endpoint: string, commitment: string, keypairBytes: Uint8Array)
   */
  static getCmdArgs(pkg: PkgName) {
    switch (pkg) {
      case PkgName.SOLANA_CLI:
      case PkgName.SPL_TOKEN_CLI:
        return [
          PgConnection.endpoint,
          PgConnection.commitment,
          PgWallet.keypairBytes,
        ];
    }
  }
}

type Command = {
  name: string;
  description: string;
};

/**
 * Commands that show up in help command
 */
const COMMANDS: Command[] = [
  {
    name: PgCommand.BUILD,
    description: "Build your program",
  },
  {
    name: PgCommand.CLEAR,
    description: "Clear terminal",
  },
  {
    name: PgCommand.CONNECT,
    description: "Toggle connection to Playground Wallet",
  },
  {
    name: PgCommand.DEPLOY,
    description: "Deploy your program",
  },
  {
    name: PgCommand.SOLANA,
    description: "Commands for interacting with Solana",
  },
  {
    name: PgCommand.SPL_TOKEN,
    description: "Commands related to SPL Token",
  },
];
