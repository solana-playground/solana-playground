import { PgTerminal } from "./terminal";
import { PgPkg, PkgName } from "./pkg";
import { PgCommon } from "../common";
import { PgWallet } from "../wallet";
import { Lang } from "../explorer";
import { EventName } from "../../../constants";

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

/** All commands type */
export type Commands = typeof PgCommand["_COMMANDS"];

/** Name of all the available commands */
export type CommandName = keyof Commands;

export class PgCommand {
  /** Execute the given command */
  static async execute(input: string) {
    // This guarantees commands only start with the specified command name.
    // solana-keygen would not count for inputCmdName === "solana"
    const inputCmdName = input.trim().split(" ")?.at(0);

    if (!inputCmdName) {
      PgTerminal.enable();
      return;
    }

    for (const cmdName in this._COMMANDS) {
      const cmd = this._COMMANDS[cmdName as CommandName];

      if (inputCmdName !== cmd.name) continue;

      if (cmd.preCheck && !cmd.preCheck()) {
        PgTerminal.enable();
        return;
      }

      return await PgTerminal.process(async () => {
        return await cmd.process(input);
      });
    }

    PgTerminal.log(`Command '${PgTerminal.italic(input)}' not found.`);
    PgTerminal.enable();
  }

  /** Get the given command */
  static getName(cmdName: CommandName) {
    return this._COMMANDS[cmdName].name;
  }

  /** All commands */
  private static readonly _COMMANDS = {
    anchor: this._createCmd({
      name: "anchor",
      description: "Anchor CLI",
      process: async (input) => {
        const { runAnchor } = await PgPkg.loadPkg(PgPkg.ANCHOR_CLI, {
          log: this._isPkgLoadingInitial(PkgName.ANCHOR_CLI),
        });

        await runAnchor!(input);
      },
      preCheck: PgWallet.checkIsPgConnected,
    }),

    build: this._createCmd({
      name: "build",
      description: "Build your program",
      process: async () => {
        await PgCommon.sendAndReceiveCustomEvent(EventName.COMMAND_BUILD);
      },
    }),

    clear: this._createCmd({
      name: "clear",
      description: "Clear terminal",
      process: async () => {
        await PgTerminal.run({ clear: [{ full: true }] });
      },
    }),

    connect: this._createCmd({
      name: "connect",
      description: "Toggle connection to Playground Wallet",
      process: async () => {
        await PgCommon.sendAndReceiveCustomEvent(EventName.COMMAND_CONNECT);
      },
    }),

    deploy: this._createCmd({
      name: "deploy",
      description: "Deploy your program",
      process: async () => {
        return await PgCommon.sendAndReceiveCustomEvent<
          undefined,
          number | undefined
        >(EventName.COMMAND_DEPLOY);
      },
    }),

    help: this._createCmd({
      name: "help",
      description: "Print help message",
      process: () => {
        const fillWhitespace = (cmdLength: number) => {
          return new Array(25 - cmdLength)
            .fill(" ")
            .reduce((acc, v) => acc + v);
        };

        const helpMessage =
          "COMMANDS:\n" +
          Object.keys(this._COMMANDS).reduce((acc, cmdName) => {
            const cmd = this._COMMANDS[cmdName as CommandName];

            return (
              acc +
              "    " +
              cmd.name +
              fillWhitespace(cmd.name.length) +
              cmd.description +
              "\n"
            );
          }, "");

        PgTerminal.log(helpMessage);
      },
    }),

    prettier: this._createCmd({
      name: "prettier",
      description: "Format the current file with prettier",
      process: async () => {
        await PgCommon.sendAndReceiveCustomEvent(EventName.EDITOR_FORMAT, {
          lang: Lang.TYPESCRIPT,
          fromTerminal: true,
        });
      },
    }),

    run: this._createCmd({
      name: "run",
      description: "Run script(s)",
      process: async (input) => {
        const match = new RegExp(/^\w+\s?(.*)/).exec(input);
        await PgCommon.sendAndReceiveCustomEvent(EventName.CLIENT_RUN, {
          isTest: false,
          path: match && match[1],
        });
      },
    }),

    rustfmt: this._createCmd({
      name: "rustfmt",
      description: "Format the current file with rustfmt",
      process: async () => {
        await PgCommon.sendAndReceiveCustomEvent(EventName.EDITOR_FORMAT, {
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

        await runSolana!(input);
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

        await runSplToken!(input);
      },
      preCheck: PgWallet.checkIsPgConnected,
    }),

    sugar: this._createCmd({
      name: "sugar",
      description:
        "Command line tool for creating and managing Metaplex Candy Machines",
      process: async (input) => {
        const { runSugar } = await PgPkg.loadPkg(PgPkg.SUGAR_CLI, {
          log: this._isPkgLoadingInitial(PkgName.SUGAR_CLI),
        });

        await runSugar!(input);
      },
      preCheck: PgWallet.checkIsPgConnected,
    }),

    test: this._createCmd({
      name: "test",
      description: "Run test(s)",
      process: async (input) => {
        const match = new RegExp(/^\w+\s?(.*)/).exec(input);
        await PgCommon.sendAndReceiveCustomEvent(EventName.CLIENT_RUN, {
          isTest: true,
          path: match && match[1],
        });
      },
    }),

    // Special commands

    runLastCmd: this._createCmd({
      name: "!!",
      description: "Run the last command",
      process: PgTerminal.runLastCmd,
    }),
  };

  /** Loaded packages */
  private static readonly _loadedPkgs: { [pkgName: string]: boolean } = {};

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

  /**
   * Create a command. This is only a type helper function.
   *
   * @param cmd command to create
   * @returns the command with `Command` type
   */
  private static _createCmd<T>(cmd: Command<T>): Readonly<Command<T>> {
    return cmd;
  }
}
