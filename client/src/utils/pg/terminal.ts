import { Terminal as XTerm, IBufferNamespace } from "xterm";

import {
  GITHUB_URL,
  OTHER_ERROR,
  PROGRAM_ERROR,
  PROJECT_NAME,
  RPC_ERROR,
  SERVER_ERROR,
} from "../../constants";
import { PgCommon } from "./common";

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
  static readonly DEFAULT_HEIGHT = "25%";

  /**
   * Minimum height of the terminal(in px)
   */
  static readonly MIN_HEIGHT = 36;

  /**
   * Welcome text
   */
  static readonly DEFAULT_TEXT = `Welcome to ${PgTerminal.bold(PROJECT_NAME)}.

Popular crates for Solana development are available to use.

See the list of available crates and request new crates from: ${PgTerminal.underline(
    GITHUB_URL
  )} `;

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

  static underline(text: string) {
    return `\x1B[4m${text}\x1B[0m`;
  }

  /**
   * Edit build stderr
   * This is what we get from a build request
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
   * Remove the last @amount chars from the current line
   */
  static removeLastChar(xterm: XTerm, amount: number = 1) {
    const commandWithoutSpace = this.getCurrentLine(xterm.buffer)
      ?.split(this.PROMPT)[1]
      .replaceAll(" ", "");

    // Don't remove the prompt text
    if (
      commandWithoutSpace === "" ||
      (commandWithoutSpace && commandWithoutSpace.length < 1)
    ) {
      return;
    }

    for (let i = 0; i < amount; i++) {
      xterm.write("\b \b");
    }
  }

  /**
   * Removes the current line
   */
  static removeCurrentLine(xterm: XTerm) {
    xterm.write(`\x1b[G\x1b`);
  }

  /**
   * This function runs when user presses `Enter` in terminal
   */
  static parseCommand(cmd: string) {
    // TODO:
  }
}
