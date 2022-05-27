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
  static DEFAULT_HEIGHT = "25%";
  static MIN_HEIGHT = 36;

  static DEFAULT_TEXT = `Welcome to ${PgTerminal.bold(PROJECT_NAME)}.

Popular crates for Solana development are available to use.

See the list of available crates and request new crates from: ${PgTerminal.underline(
    GITHUB_URL
  )}`;

  // Emojis
  static CROSS = "❌";
  static CHECKMARK = "✅";

  private static TEXTS: TextInfo[] = [
    { text: "error", state: TextState.ERROR },
    { text: "warning", state: TextState.WARNING },
    { text: "Finished", state: TextState.SUCCESS },
  ];

  static colorText(text: string) {
    for (const textInfo of this.TEXTS) {
      text = text.replaceAll(textInfo.text, this.getColorFromState(textInfo));
    }

    return text;
  }

  static getColorFromState(textInfo: TextInfo) {
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
      const whiteSpaceStartIndex = startIndex - 7; // This is the most amount of whitespace
      stderr =
        stderr.substring(0, whiteSpaceStartIndex) +
        stderr.substring(whiteSpaceStartIndex, startIndex).replaceAll(" ", "") +
        stderr.substring(startIndex);
    }

    return stderr;
  };

  /**
   * Improve error messages
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
}
