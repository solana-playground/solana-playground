import { ITerminalOptions, Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";

import { PgTty } from "./tty";
import { PgShell } from "./shell";
import {
  GITHUB_URL,
  Id,
  OTHER_ERROR,
  PROGRAM_ERROR,
  PROJECT_NAME,
  RPC_ERROR,
  SERVER_ERROR,
} from "../../../constants";
import { TerminalAction } from "../../../state";
import { PgCommon } from "../common";
import { PkgName, Pkgs } from "./pkg";
import { PgProgramInfo } from "../program-info";

enum TextState {
  SUCCESS = 0,
  ERROR = 1,
  WARNING = 2,
  INFO = 3,
  PRIMARY = 4, // Primary theme color
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
   * Default prompt string before entering commands
   */
  static readonly PROMPT = "$ ";

  /**
   * Prompt after '
   */
  static readonly CONTINUATION_PROMPT_PREFIX = "> ";

  /**
   * Event name for logging terminal
   */
  static readonly EVT_NAME_TERMINAL_LOG = "terminallog";
  static readonly EVT_NAME_TERMINAL_STATE = "terminalstate";
  static readonly EVT_NAME_TERMINAL_ENABLE = "terminalenable";
  static readonly EVT_NAME_TERMINAL_DISABLE = "terminaldisable";
  static readonly EVT_NAME_LOAD_PKG = "terminalloadpkg";
  static readonly EVT_NAME_SCROLL_TO_BOTTOM = "terminalscrolltobottom";
  static readonly EVT_NAME_RUN_LAST_CMD = "terminalrunlastcmd";
  static readonly EVT_NAME_RUN_CMD_FROM_STR = "terminalruncmdfromstr";

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
   * Give color before printing to terminal
   */
  static colorText(text: string) {
    for (const textInfo of this.TEXTS) {
      text = text.replaceAll(textInfo.text, this.getColorFromState(textInfo));
    }

    // Match until ':' from the start of the line: e.g SUBCOMMANDS:
    // TODO: Highlight the text from WASM so we don't have to do this.
    text = text.replace(/^(.*?:)/gm, (match) => {
      if (!match.includes("   ") && match.startsWith(" ")) {
        return this.bold(match); // Indented
      }
      if (!match.toLowerCase().includes("error") && !match.includes("  ")) {
        return this.primary(match);
      }

      return match;
    });

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
      case TextState.PRIMARY:
        return this.primary(textInfo.text);
      default:
        return textInfo.text;
    }
  }

  static success(text: string) {
    return `\x1b[1;32m${text}\x1b[0m`;
  }

  static error(text: string) {
    return `\x1b[1;31m${text}\x1b[0m`;
  }

  static warning(text: string) {
    return `\x1b[1;33m${text}\x1b[0m`;
  }

  static info(text: string) {
    return `\x1b[1;34m${text}\x1b[0m`;
  }

  static primary(text: string) {
    return `\x1b[1;35m${text}\x1b[0m`;
  }

  static bold(text: string) {
    return `\x1b[1m${text}\x1b[0m`;
  }

  static italic(text: string) {
    return `\x1b[3m${text}\x1b[0m`;
  }

  static underline(text: string) {
    return `\x1b[4m${text}\x1b[0m`;
  }

  /**
   * Edit build stderr that is returned from the build request
   */
  static editStderr(stderr: string) {
    // Remove full path
    stderr = stderr.replace(/\s\(\/home.+?(?=\s)/g, "");

    // Remove uuid from folders
    const uuid = PgProgramInfo.getProgramInfo().uuid;
    if (uuid) stderr = stderr.replaceAll(uuid, "");

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
  }

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
   * Gets whether the terminal is focused or in blur
   */
  static isTerminalFocused() {
    return document
      .getElementsByClassName("terminal xterm xterm-dom-renderer-owner-1")[0]
      ?.classList.contains("focus");
  }

  /**
   * Set terminal state from anywhere
   */
  static setTerminalState(action: TerminalAction) {
    PgCommon.createAndDispatchCustomEvent(this.EVT_NAME_TERMINAL_STATE, {
      action,
    });
  }

  /**
   * Dispatch enable terminal custom event
   */
  static enable() {
    PgCommon.createAndDispatchCustomEvent(this.EVT_NAME_TERMINAL_ENABLE);
  }

  /**
   * Dispatch disable terminal custom event
   */
  static disable() {
    PgCommon.createAndDispatchCustomEvent(this.EVT_NAME_TERMINAL_DISABLE);
  }

  /**
   * Log terminal messages from anywhere
   *
   * Mainly used from WASM
   */
  static logWasm(msg: string) {
    PgCommon.createAndDispatchCustomEvent(this.EVT_NAME_TERMINAL_LOG, { msg });
  }

  /**
   * Dispatch load pkg terminal custom event
   */
  static loadPkg(pkg: PkgName) {
    PgCommon.createAndDispatchCustomEvent(this.EVT_NAME_LOAD_PKG, {
      pkg,
    });
  }

  /**
   * Dispatch scroll to bottom custom event
   */
  static scrollToBottom() {
    PgCommon.createAndDispatchCustomEvent(this.EVT_NAME_SCROLL_TO_BOTTOM);
  }

  /**
   * Wrapper function for commands that interact with the terminal
   *
   * This function should be used as a wrapper function when calling any
   * terminal command.
   */
  static async run<T>(cb: () => Promise<T>) {
    this.disable();
    this.scrollToBottom();
    try {
      return await cb();
    } catch {
    } finally {
      this.enable();
    }
  }

  /**
   * Dispatch run last command custom event
   */
  static runLastCmd() {
    PgCommon.createAndDispatchCustomEvent(this.EVT_NAME_RUN_LAST_CMD);
  }

  /**
   * Dispatch run cmd from str custom event
   */
  static runCmdFromStr(cmd: string) {
    PgCommon.createAndDispatchCustomEvent(this.EVT_NAME_RUN_CMD_FROM_STR, cmd);
  }
}

export class PgTerm {
  private _xterm: XTerm;
  private _container: HTMLElement | null;
  private _webLinksAddon: WebLinksAddon;
  private _fitAddon: FitAddon;
  private _pgTty: PgTty;
  private _pgShell: PgShell;
  private _isOpen: boolean;
  private _fitTimeoutId?: NodeJS.Timeout;

  constructor(xtermOptions?: ITerminalOptions) {
    // Create xterm element
    this._xterm = new XTerm(xtermOptions);

    // Container is empty at start
    this._container = null;

    this._xterm.onResize(this._handleTermResize);
    this._xterm.onKey((keyEvent: { key: string; domEvent: KeyboardEvent }) => {
      if (keyEvent.key === " ") {
        keyEvent.domEvent.preventDefault();
        return false;
      }
    });

    // Load xterm addons
    this._webLinksAddon = new WebLinksAddon();
    this._fitAddon = new FitAddon();
    this._xterm.loadAddon(this._fitAddon);
    this._xterm.loadAddon(this._webLinksAddon);

    // Create  Shell and TTY
    this._pgTty = new PgTty(this._xterm);
    this._pgShell = new PgShell(this._pgTty);

    // Any data event (key, paste...)
    this._xterm.onData(this._pgShell.handleTermData);

    this._isOpen = false;
  }

  setPkgs(pkgs: Pkgs) {
    this._pgShell.setPkgs(pkgs);
  }

  open(container: HTMLElement) {
    this._container = container;

    this._xterm.open(container);
    this._isOpen = true;

    // Print welcome text
    this.println(PgTerminal.DEFAULT_TEXT);

    // Enable prompt
    this.enable();
  }

  fit() {
    this._fitAddon.fit();

    // Timeout fixes prompt message not showing in some rare cases
    if (this._fitTimeoutId) clearTimeout(this._fitTimeoutId);

    this._fitTimeoutId = setTimeout(() => {
      if (
        this._pgShell.isPrompting() &&
        !this._pgTty.getInputStartsWithPrompt()
      ) {
        const input = this._pgTty.getInput();
        if (input) {
          this._pgTty.clearInput();
          this._pgShell.prompt();
          this._pgTty.setInput(input);
        } else {
          // Clear the input in case of a prompt bug where there is a text before the prompt
          this._pgTty.clearCurrentLine();
          this._pgShell.prompt();
        }
      }
    }, 100); // time needs to be lower than specified fit interval in Terminal component
  }

  /**
   * Used for overriding default xterm key event handler
   */
  attachCustomKeyEventHandler(
    customKeyEventHandler: (e: KeyboardEvent) => boolean
  ) {
    this._xterm.attachCustomKeyEventHandler(customKeyEventHandler);
  }
  /**
   * Focus terminal and scroll to cursor
   */
  focus() {
    this._xterm.focus();
    this.scrollToCursor();
  }

  /**
   * Scroll terminal to wherever the cursor currently is
   */
  scrollToCursor() {
    if (!this._container) {
      return;
    }

    // We don't need cursorX, since we want to start at the beginning of the terminal.
    const cursorY = this._pgTty.getBuffer().cursorY;
    const size = this._pgTty.getSize();

    const containerBoundingClientRect = this._container.getBoundingClientRect();

    // Find how much to scroll because of our cursor
    const cursorOffsetY =
      (cursorY / size.rows) * containerBoundingClientRect.height;

    let scrollX = containerBoundingClientRect.left;
    let scrollY = containerBoundingClientRect.top + cursorOffsetY + 10;

    if (scrollX < 0) {
      scrollX = 0;
    }
    if (scrollY > document.body.scrollHeight) {
      scrollY = document.body.scrollHeight;
    }

    window.scrollTo(scrollX, scrollY);
  }

  /**
   * Print a message to terminal
   */
  print(message: string, sync?: boolean) {
    // For some reason, double new lines are not respected. Thus, fixing that here
    message = message.replace(/\n\n/g, "\n \n");

    if (!this._isOpen) {
      return;
    }

    if (this._pgShell.isPrompting()) {
      // Cancel the current prompt and restart
      this._pgShell.printAndRestartPrompt(() => {
        this._pgTty.print(message + "\n", sync);
        return undefined;
      });
      return;
    }

    this._pgTty.print(message, sync);
  }

  /**
   * Print a message with end line character appended
   */
  println(message: string, sync?: boolean) {
    this.print(message + "\n", sync);
  }

  /**
   * Run the line as command
   */
  runCommand(line: string) {
    if (this._pgShell.isPrompting()) {
      this._pgTty.setInput(line);
      this._pgShell.handleReadComplete();
    }
  }

  /**
   * Get terminal selection as string
   */
  getSelection() {
    return this._xterm.getSelection();
  }

  /**
   * Moves the command line to the top of the terminal screen
   *
   * This function does not clear previous history.
   */
  clear() {
    this._pgTty.clearTty();
    this._pgTty.print(`${PgTerminal.PROMPT}${this._pgTty.getInput()}`);
  }

  /**
   * Disable shell:
   * - Disables shell
   * - Clears current line for  for actions that were committed from outside of terminal
   * like pressing build button
   */
  disable() {
    this._pgShell.disable();
    this._pgTty.clearCurrentLine();
  }

  /**
   * Enable shell
   */
  enable() {
    this._pgShell.enable();
  }

  /**
   * Scroll the terminal to bottom
   */
  scrollToBottom() {
    this._xterm.scrollToBottom();
  }

  /**
   * Destroy xterm instance
   */
  destroy() {
    this._xterm.dispose();
    // @ts-ignore
    delete this._xterm;
  }

  /**
   * Run the last command if it exists
   *
   * This function is useful for running wasm cli packages after initial loading
   */
  runLastCmd() {
    // Last command is the current input
    let lastCmd = this._pgTty.getInput();
    if (!lastCmd) {
      const maybeLastCmd = this._pgShell.getHistory().getPrevious();
      if (maybeLastCmd) lastCmd = maybeLastCmd;
      else this.println("Unable to run last command.");
    }

    this.runCmdFromStr(lastCmd);
  }

  /**
   * Write the given input in the terminal and press enter
   */
  runCmdFromStr(cmd: string) {
    this._pgTty.setInput(cmd);
    this._pgShell.handleReadComplete(true);
  }

  /**
   * Handle terminal resize
   *
   * This function clears the prompt using the previous configuration,
   * updates the cached terminal size information and then re-renders the
   * input. This leads (most of the times) into a better formatted input.
   *
   * Also stops multiline inputs rendering unnecessarily.
   */
  private _handleTermResize = (data: { rows: number; cols: number }) => {
    const { rows, cols } = data;
    this._pgTty.clearInput();
    this._pgTty.setTermSize(cols, rows);
    this._pgTty.setInput(this._pgTty.getInput(), true);
  };
}
