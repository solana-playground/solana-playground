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
  /** All commands */
  static readonly COMMANDS = {
    anchor: this._createCmd({
      name: "anchor",
      description: "Anchor CLI",
      process: (input) => {
        PgTerminal.process(async () => {
          const { runAnchor } = await PgPkg.loadPkg(PgPkg.ANCHOR_CLI, {
            log: this._isPkgLoadingInitial(PkgName.ANCHOR_CLI),
          });

          await runAnchor!(input);
        });
      },
      preCheck: PgWallet.checkIsPgConnected,
    }),

    build: this._createCmd({
      name: "build",
      description: "Build your program",
      process: () => {
        PgTerminal.setTerminalState(TerminalAction.buildStart);
      },
    }),

    clear: this._createCmd({
      name: "clear",
      description: "Clear terminal",
      process: () => {
        PgTerminal.process(async () => {
          await PgTerminal.run({ clear: [{ full: true }] });
        });
      },
    }),

    connect: this._createCmd({
      name: "connect",
      description: "Toggle connection to Playground Wallet",
      process: () => {
        PgTerminal.setTerminalState(TerminalAction.walletConnectOrSetupStart);
      },
    }),

    deploy: this._createCmd({
      name: "deploy",
      description: "Deploy your program",
      process: () => {
        PgTerminal.setTerminalState(TerminalAction.deployStart);
      },
    }),

    help: this._createCmd({
      name: "help",
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
          Object.keys(this.COMMANDS).reduce((acc, cmdName) => {
            const cmd = this.COMMANDS[cmdName as keyof typeof this.COMMANDS];

            return (
              acc +
              indent +
              cmd.name +
              fillWhitespace(cmd.name.length) +
              cmd.description +
              "\n"
            );
          }, "");

        PgTerminal.log(helpMessage);
        PgTerminal.enable();
      },
    }),

    prettier: this._createCmd({
      name: "prettier",
      description: "Format the current file with prettier",
      process: () => {
        PgCommon.createAndDispatchCustomEvent(EventName.EDITOR_FORMAT, {
          lang: Lang.TYPESCRIPT,
          fromTerminal: true,
        });
      },
    }),

    run: this._createCmd({
      name: "run",
      description: "Run script(s)",
      process: (input) => {
        const match = new RegExp(/^\w+\s?(.*)/).exec(input);
        PgCommon.createAndDispatchCustomEvent(EventName.CLIENT_RUN, {
          isTest: false,
          path: match && match[1],
        });
      },
    }),

    rustfmt: this._createCmd({
      name: "rustfmt",
      description: "Format the current file with rustfmt",
      process: () => {
        PgCommon.createAndDispatchCustomEvent(EventName.EDITOR_FORMAT, {
          lang: Lang.RUST,
          fromTerminal: true,
        });
      },
    }),

    solana: this._createCmd({
      name: "solana",
      description: "Commands for interacting with Solana",
      process: async (input) => {
        const { runSolana } = await PgPkg.loadPkg(PgPkg.SOLANA_CLI, {
          log: this._isPkgLoadingInitial(PkgName.SOLANA_CLI),
        });

        runSolana!(input, ...PgCommand._getCmdArgs(PkgName.SOLANA_CLI)!);
      },
      preCheck: PgWallet.checkIsPgConnected,
    }),

    splToken: this._createCmd({
      name: "spl-token",
      description: "Commands for interacting with SPL Tokens",
      process: async (input) => {
        const { runSplToken } = await PgPkg.loadPkg(PgPkg.SPL_TOKEN_CLI, {
          log: this._isPkgLoadingInitial(PkgName.SPL_TOKEN_CLI),
        });

        runSplToken!(input, ...PgCommand._getCmdArgs(PkgName.SPL_TOKEN_CLI)!);
      },
      preCheck: PgWallet.checkIsPgConnected,
    }),

    sugar: this._createCmd({
      name: "sugar",
      description:
        "Command line tool for creating and managing Metaplex Candy Machines",
      process: (input) => {
        PgTerminal.process(async () => {
          const { runSugar } = await PgPkg.loadPkg(PgPkg.SUGAR_CLI, {
            log: this._isPkgLoadingInitial(PkgName.SUGAR_CLI),
          });

          await runSugar!(input);
        });
      },
      preCheck: PgWallet.checkIsPgConnected,
    }),

    test: this._createCmd({
      name: "test",
      description: "Run test(s)",
      process: (input) => {
        const match = new RegExp(/^\w+\s?(.*)/).exec(input);
        PgCommon.createAndDispatchCustomEvent(EventName.CLIENT_RUN, {
          isTest: true,
          path: match && match[1],
        });
      },
    }),

    // Special commands

    // Run last command
    runLastCmd: this._createCmd({
      name: "!!",
      description: "Run the last command",
      process: PgTerminal.runLastCmd,
    }),
  };

  /** Execute the given command */
  static async execute(input: string) {
    // This guarantees command only start with the specified command name
    // solana-keygen would not count for cmdName === "solana"
    const cmdName = input.trim().split(" ")?.at(0);

    for (const index in this.COMMANDS) {
      const cmd = this.COMMANDS[index as keyof typeof PgCommand.COMMANDS];
      if (cmd.name !== cmdName) continue;

      if (cmd.preCheck && !cmd.preCheck()) {
        PgTerminal.enable();
        return;
      }

      return await cmd.process(input);
    }

    if (cmdName) {
      PgTerminal.log(`Command '${PgTerminal.italic(input)}' not found.`);
    }

    // Only new prompt after invalid command, other commands will automatically
    // generate new prompt
    PgTerminal.enable();
  }

  /** Loaded packages */
  private static readonly _loadedPkgs: { [pkgName: string]: boolean } = {};

  /**
   * Create a command. This is only a type helper function.
   *
   * @param cmd command to create
   * @returns the command with `Command` type
   */
  private static _createCmd(cmd: Command) {
    return cmd;
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
