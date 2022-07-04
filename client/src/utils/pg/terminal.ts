import { Terminal as XTerm, IBufferNamespace } from "xterm";
import { Wasm } from "../../components/Panels/Main/Terminal/useWasm";

import {
  GITHUB_URL,
  Id,
  OTHER_ERROR,
  PROGRAM_ERROR,
  PROJECT_NAME,
  RPC_ERROR,
  SERVER_ERROR,
} from "../../constants";
import { TerminalAction } from "../../state";
import { PgCommon } from "./common";
import { PgConnection } from "./connection";
import { PgWallet } from "./wallet";

enum TextState {
  SUCCESS = 0,
  ERROR = 1,
  WARNING = 2,
  INFO = 3,
}

interface TextInfo {
  text: string;
  state: TextState;
}

export class PgTerminal {
  /**
   * Default height of the terminal
   */
  static get DEFAULT_HEIGHT() {
    return Math.floor(window.innerHeight / 4);
  }

  /**
   * Minimum height of the terminal(in px)
   */
  static readonly MIN_HEIGHT = 36;

  /**
   * Maximum height for the terminal
   * This is to fix bottom of the terminal not being visible due to
   * incorrect resizing
   */
  static get MAX_HEIGHT() {
    const tabHeight = document
      .getElementById(Id.TABS)
      ?.getBoundingClientRect()?.height;
    const bottomHeight = document
      .getElementById(Id.BOTTOM)
      ?.getBoundingClientRect()?.height;

    if (tabHeight && bottomHeight) {
      return window.innerHeight - (tabHeight + bottomHeight);
    }

    return this.DEFAULT_HEIGHT;
  }

  /**
   * Welcome text
   */
  static readonly DEFAULT_TEXT = `Welcome to ${PgTerminal.bold(PROJECT_NAME)}.

Popular crates for Solana development are available to use.

See the list of available crates and request new crates from: ${PgTerminal.underline(
    GITHUB_URL
  )}

Type ${PgTerminal.bold("help")} to see all commands.`;

  /**
   * Help command text
   */
  static readonly HELP_TEXT = `COMMANDS:
  build                      Build your program
  connect                    Toggle connection to Playground Wallet
  deploy                     Deploy your program
  solana                     Access Solana CLI commands
`;

  /**
   * Default prompt string before entering commands
   */
  static readonly PROMPT = "$ ";

  // Emojis
  static readonly CROSS = "❌";
  static readonly CHECKMARK = "✅";

  /**
   * These text-state pairs will be used to give colors before printing
   */
  private static readonly TEXTS: TextInfo[] = [
    { text: "error", state: TextState.ERROR },
    { text: "Error", state: TextState.ERROR },
    { text: "warning", state: TextState.WARNING },
  ];

  /**
   * Give color to the specified keywords in TEXTS
   */
  static colorText(text: string) {
    for (const textInfo of this.TEXTS) {
      text = text.replaceAll(textInfo.text, this.getColorFromState(textInfo));
    }

    return text;
  }

  /**
   * Helper function for colorText
   */
  private static getColorFromState(textInfo: TextInfo) {
    switch (textInfo.state) {
      case TextState.SUCCESS:
        return this.success(textInfo.text);
      case TextState.ERROR:
        return this.error(textInfo.text);
      case TextState.WARNING:
        return this.warning(textInfo.text);
      case TextState.INFO:
        return this.info(textInfo.text);
      default:
        return textInfo.text;
    }
  }

  static success(text: string) {
    return `\x1B[1;32m${text}\x1B[0m`;
  }

  static error(text: string) {
    return `\x1B[1;31m${text}\x1B[0m`;
  }

  static warning(text: string) {
    return `\x1B[1;33m${text}\x1B[0m`;
  }

  static info(text: string) {
    return `\x1B[1;34m${text}\x1B[0m`;
  }

  static bold(text: string) {
    return `\x1B[1m${text}\x1B[0m`;
  }

  static italic(text: string) {
    return `\x1B[3m${text}\x1B[0m`;
  }

  static underline(text: string) {
    return `\x1B[4m${text}\x1B[0m`;
  }

  /**
   * Edit build stderr that is returned from the build request
   */
  static editStderr = (stderr: string, uuid: string) => {
    // Remove full path
    stderr = stderr.replace(/\s\(\/home.+?(?=\s)/g, "");

    // Remove uuid from folders
    stderr = stderr.replaceAll(uuid, "");

    // Remove rustc error line
    let startIndex = stderr.indexOf("For more");
    if (startIndex !== -1) {
      const endIndex = stderr.indexOf("\n", startIndex);
      stderr = stderr.substring(0, startIndex) + stderr.substring(endIndex + 1);
    }

    // Remove Compiling message
    stderr = stderr.replace("Compiling solpg v0.1.0\n", "");

    // Remove whitespace before 'Finished'
    startIndex = stderr.indexOf("Finished release");
    if (startIndex !== -1) {
      const whiteSpaceStartIndex = startIndex - 7; // 7 is the most amount of whitespace
      stderr =
        stderr.substring(0, whiteSpaceStartIndex) + // Until whitespace start
        stderr.substring(whiteSpaceStartIndex, startIndex).replaceAll(" ", "") +
        this.success("Build successful. ") +
        "Completed" +
        stderr
          .substring(stderr.indexOf(" in", startIndex))
          .replace("\n", ".\n"); // Time passed
    }

    return stderr;
  };

  /**
   * Make error messages more friendly
   */
  static convertErrorMessage(msg: string) {
    // Hex program errors
    for (const programErrorCode in PROGRAM_ERROR) {
      if (msg.endsWith("0x" + programErrorCode.toLowerCase())) {
        const parts = msg.split(":");

        let ixIndex = parts[2][parts[2].length - 1];
        if (!PgCommon.isInt(ixIndex)) ixIndex = "0";
        const programError = PROGRAM_ERROR[programErrorCode];

        msg = `\n${this.bold("Instruction index:")} ${ixIndex}\n${this.bold(
          "Reason:"
        )} ${programError}`;

        return msg;
      }
    }

    // Descriptive program errors
    if (msg.startsWith("failed to send")) {
      const parts = msg.split(":");
      // With ix index
      if (parts.length === 4) {
        const ixIndex = parts[2][parts[2].length - 1];
        const programError = parts[3][1].toUpperCase() + parts[3].substring(2);

        msg = `\n${this.bold("Instruction index:")} ${ixIndex}\n${this.bold(
          "Reason:"
        )} ${programError}.`;

        return msg;
      }

      // Without ix index
      const programError = parts[2][1].toUpperCase() + parts[2].substring(2);
      msg = `\n${this.bold("Reason:")} ${programError}.`;

      return msg;
    }

    // Rpc errors
    for (const rpcError in RPC_ERROR) {
      if (msg.includes(rpcError)) {
        msg = RPC_ERROR[rpcError];
        return msg;
      }
    }

    // Server errors
    for (const serverError in SERVER_ERROR) {
      if (msg === serverError) {
        msg = SERVER_ERROR[serverError];
        return msg;
      }
    }

    // Other errors
    for (const otherError in OTHER_ERROR) {
      if (msg === otherError) {
        msg = OTHER_ERROR[otherError];
        return msg;
      }
    }

    return msg;
  }

  /**
   * Gets the current XTerm line
   */
  static getCurrentLine(buffer: IBufferNamespace) {
    return buffer.normal
      .getLine(buffer.normal.baseY + buffer.normal.cursorY)
      ?.translateToString();
  }

  /**
   * Clears the current line
   */
  static clearCurrentLine(xterm: XTerm) {
    // Clears the whole line
    xterm.write(`\x1b[G\x1b`);
    // This also clears the line but helps with parsing errors
    xterm.write(`\x1b[2K`);
  }

  /**
   * Runs when user presses a key when the terminal is in focus
   */
  static isCharValid(char: string) {
    return char.match(/^[\w.\-/+\\='":;|,?><`~!@#$%^&*()[\]{} ]+$/);
  }

  /**
   * Gets whether the terminal is focused or in blur
   */
  static isTerminalFocused() {
    return document
      .getElementsByClassName("terminal xterm xterm-dom-renderer-owner-1")[0]
      ?.classList.contains("focus");
  }

  /**
   * Get the remaining Solana CLI args
   * (endpoint: string, commitment: string, keypairBytes: Uint8Array)
   */
  static getSolanaCliArgs() {
    let args = [];

    const endpoint = PgConnection.endpoint;
    args.push(endpoint);

    const commitment = PgConnection.commitment;
    args.push(commitment);

    const keypairBytes = PgWallet.keypairBytes;
    args.push(keypairBytes);

    return args;
  }

  /**
   * This function runs when user presses `Enter` in terminal
   * @returns if the command is valid
   */
  static parseCommand(
    cmd: string,
    setTerminalState: (update: TerminalAction) => void,
    wasm?: Wasm
  ) {
    cmd = cmd.trim();
    if (cmd === "help") {
      this.logWasm(this.HELP_TEXT);
      this.prompt();
      return true;
    }
    if (cmd === "build") {
      setTerminalState(TerminalAction.buildStart);
      return true;
    }
    if (cmd === "connect") {
      setTerminalState(TerminalAction.walletConnectOrSetupStart);
      return true;
    }
    if (cmd === "deploy") {
      if (PgWallet.checkIfPgConnected())
        setTerminalState(TerminalAction.deployStart);

      return true;
    }

    // This guarantees command only start with the specified command name
    // solana-keygen would not count for cmdName === "solana"
    const cmdName = cmd.split(" ")?.at(0);

    if (cmdName === "solana") {
      if (wasm) {
        if (PgWallet.checkIfPgConnected()) {
          // @ts-ignore
          wasm.parseSolana(cmd, ...this.getSolanaCliArgs());
        }

        return true;
      }
    }

    return false;
  }

  /**
   * Logs messages to terminal.
   * Mainly used from WASM.
   */
  static logWasm(msg: string) {
    const customLogEvent = new CustomEvent("logterminal", { detail: { msg } });

    document.dispatchEvent(customLogEvent);
  }

  /**
   * Sends prompt message to terminal
   */
  static prompt() {
    this.logWasm(this.PROMPT);
  }
}
