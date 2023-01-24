import { PgCommon } from "../common";
import { PgConnection } from "../connection";
import { PgWallet } from "../wallet";
import { PgPkg, PkgName } from "./pkg";
import { PgTerminal } from "./terminal";
import { TerminalAction } from "../../../state";
import { EventName } from "../../../constants";
import { Lang } from "../explorer";

interface Command {
  /** Name of the command */
  name: string;
  /** Description that will be seen in the `help` command */
  description: string;
  /** Function to run when the command is called */
  process: (input: string) => void | Promise<void>;
  /* Only process the command if the condition passes */
  preCheck?: () => boolean;
}

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
  static readonly SUGAR = "sugar";
  static readonly TEST = "test";

  /**
   * Load the commands.
   *
   * NOTE: This function must be run in order for commands to work.
   */
  static load() {
    if (this._commandsLoaded) return;

    this._add(
      {
        name: this.BUILD,
        description: "Build your program",
        process: () => {
          PgTerminal.setTerminalState(TerminalAction.buildStart);
        },
      },

      {
        name: this.CLEAR,
        description: "Clear terminal",
        process: () => {
          PgTerminal.runCmd(async () => {
            await PgTerminal.run({ clear: [{ full: true }] });
          });
        },
      },

      {
        name: this.CONNECT,
        description: "Toggle connection to Playground Wallet",
        process: () => {
          PgTerminal.setTerminalState(TerminalAction.walletConnectOrSetupStart);
        },
      },

      {
        name: this.DEPLOY,
        description: "Deploy your program",
        process: () => {
          PgTerminal.setTerminalState(TerminalAction.deployStart);
        },
      },

      {
        name: this.HELP,
        description: "Print help message",
        process: () => {
          const commandsText = "COMMANDS:\n";
          const indent = "    ";

          const fillWhitespace = (cmdLength: number) => {
            return new Array(25 - cmdLength)
              .fill(" ")
              .reduce((acc, v) => acc + v);
          };

          const helpMessage =
            commandsText +
            this._commands.reduce(
              (acc, cmd) =>
                acc +
                indent +
                cmd.name +
                fillWhitespace(cmd.name.length) +
                cmd.description +
                "\n",
              ""
            );

          PgTerminal.log(helpMessage);
          PgTerminal.enable();
        },
      },

      {
        name: this.PRETTIER,
        description: "Format the current file with prettier",
        process: () => {
          PgCommon.createAndDispatchCustomEvent(EventName.EDITOR_FORMAT, {
            lang: Lang.TYPESCRIPT,
            fromTerminal: true,
          });
        },
      },

      {
        name: this.RUN,
        description: "Run script(s)",
        process: (input) => {
          const match = new RegExp(/^\w+\s?(.*)/).exec(input);
          PgCommon.createAndDispatchCustomEvent(EventName.CLIENT_RUN, {
            isTest: false,
            path: match && match[1],
          });
        },
      },

      {
        name: this.RUSTFMT,
        description: "Format the current file with rustfmt",
        process: () => {
          PgCommon.createAndDispatchCustomEvent(EventName.EDITOR_FORMAT, {
            lang: Lang.RUST,
            fromTerminal: true,
          });
        },
      },

      {
        name: this.SOLANA,
        description: "Commands for interacting with Solana",
        process: async (input) => {
          const { runSolana } = await PgPkg.loadPkg(PgPkg.SOLANA_CLI, {
            log: this._isPkgLoadingInitial(PkgName.SOLANA_CLI),
          });

          runSolana!(input, ...PgCommand._getCmdArgs(PkgName.SOLANA_CLI)!);
        },
        preCheck: () => PgWallet.checkIsPgConnected(),
      },

      {
        name: this.SPL_TOKEN,
        description: "Commands for interacting with SPL Tokens",
        process: async (input) => {
          const { runSplToken } = await PgPkg.loadPkg(PgPkg.SPL_TOKEN_CLI, {
            log: this._isPkgLoadingInitial(PkgName.SPL_TOKEN_CLI),
          });

          runSplToken!(input, ...PgCommand._getCmdArgs(PkgName.SPL_TOKEN_CLI)!);
        },
        preCheck: () => PgWallet.checkIsPgConnected(),
      },

      {
        name: this.SUGAR,
        description:
          "Command line tool for creating and managing Metaplex Candy Machines",
        process: (input) => {
          PgTerminal.runCmd(async () => {
            const { runSugar } = await PgPkg.loadPkg(PgPkg.SUGAR_CLI, {
              log: this._isPkgLoadingInitial(PkgName.SUGAR_CLI),
            });

            await runSugar!(input);
          });
        },
        preCheck: () => PgWallet.checkIsPgConnected(),
      },

      {
        name: this.TEST,
        description: "Run test(s)",
        process: (input) => {
          const match = new RegExp(/^\w+\s?(.*)/).exec(input);
          PgCommon.createAndDispatchCustomEvent(EventName.CLIENT_RUN, {
            isTest: true,
            path: match && match[1],
          });
        },
      },

      // Special commands

      // Run last command
      {
        name: this.RUN_LAST_CMD,
        description: "Run the last command",
        process: PgTerminal.runLastCmd,
      }
    );

    this._commandsLoaded = true;
  }

  /** Execute the given command */
  static async execute(input: string) {
    // This guarantees command only start with the specified command name
    // solana-keygen would not count for cmdName === "solana"
    const cmdName = input.trim().split(" ")?.at(0);

    for (const command of this._commands) {
      if (command.name !== cmdName) continue;

      if (command.preCheck && !command.preCheck()) {
        PgTerminal.enable();
        return;
      }

      return await command.process(input);
    }

    if (cmdName) {
      PgTerminal.log(`Command '${PgTerminal.italic(input)}' not found.`);
    }

    // Only new prompt after invalid command, other commands will automatically
    // generate new prompt
    PgTerminal.enable();
  }

  /** Loaded commands */
  private static readonly _commands: Command[] = [];

  /** Whether the commands has been loaded */
  private static _commandsLoaded = false;

  /** Loaded packages */
  private static readonly _loadedPkgs: { [pkgName: string]: boolean } = {};

  /** Add a new command */
  private static _add(...commands: Command[]) {
    this._commands.push(...commands);
  }

  /**
   * Get the remaining args for the command
   *
   * - Solana: (endpoint: string, commitment: string, keypairBytes: Uint8Array)
   * - SPL-Token: (endpoint: string, commitment: string, keypairBytes: Uint8Array)
   */
  private static _getCmdArgs(pkgName: PkgName) {
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

  /**
   * Get whether the package is being loaded for the first time and set the
   * package's loaded state to `true`
   *
   * @param pkgName package name
   * @returns `true` if the package hasn't been loaded before
   */
  private static _isPkgLoadingInitial(pkgName: PkgName) {
    const initial = !this._loadedPkgs[pkgName];
    if (initial) {
      this._loadedPkgs[pkgName] = true;
    }

    return initial;
  }
}
