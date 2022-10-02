import { PgConnection } from "../connection";
import { PgWallet } from "../wallet";
import { PkgName } from "./pkg";

export class PgCommand {
  static readonly BUILD = "build";
  static readonly CLEAR = "clear";
  static readonly CONNECT = "connect";
  static readonly DEPLOY = "deploy";
  static readonly HELP = "help";
  static readonly PRETTIER = "prettier";
  static readonly RUN = "run";
  static readonly RUN_LAST_CMD = "!!";
  static readonly RUSTFMT = "rustfmt";
  static readonly SOLANA = "solana";
  static readonly SPL_TOKEN = "spl-token";
  static readonly TEST = "test";

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
  static getCmdArgs(pkgName: PkgName) {
    switch (pkgName) {
      case PkgName.SOLANA_CLI:
      case PkgName.SPL_TOKEN_CLI:
        return [
          PgConnection.endpoint,
          PgConnection.commitment,
          PgWallet.keypairBytes,
        ] as [string, string, Uint8Array];
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
    name: PgCommand.PRETTIER,
    description: "Format the current file with prettier",
  },
  {
    name: PgCommand.RUN,
    description: "Run all scripts in client directory",
  },
  {
    name: PgCommand.RUSTFMT,
    description: "Format the current file with rustfmt",
  },
  {
    name: PgCommand.SOLANA,
    description: "Commands for interacting with Solana",
  },
  {
    name: PgCommand.SPL_TOKEN,
    description: "Commands for interacting with SPL Tokens",
  },
  {
    name: PgCommand.TEST,
    description: "Run all tests in tests directory",
  },
];
