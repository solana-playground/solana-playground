import { ITerminalOptions, Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import { format } from "util";

import { PgTty } from "./tty";
import { PgShell } from "./shell";
import {
  Emoji,
  EventName,
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
import { PgProgramInfo } from "../program-info";
import { PgMethod, PgReturnType } from "../types";

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

  /** Default prompt string before entering commands */
  static readonly PROMPT_PREFIX = "$ ";

  /** Prompt after `\` or `'` */
  static readonly CONTINUATION_PROMPT_PREFIX = "> ";

  /** Prefix for the waiting user input prompt message */
  static readonly WAITING_INPUT_MSG_PREFIX = "? ";

  /** Prompt prefix for waiting user input */
  static readonly WAITING_INPUT_PROMPT_PREFIX = ">> ";

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

  static secondary(text: string) {
    return `\x1b[1;36m${text}\x1b[0m`;
  }

  static secondaryText(text: string) {
    return `\x1b[30m${text}\x1b[0m`;
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
   * Hightlight the text before printing to terminal
   */
  static colorText(text: string) {
    text = text
      // Match for error
      .replace(
        /\w*\s(\w*)error(\[|:)/gim,
        (match) =>
          this.error(match.substring(0, match.length - 1)) +
          match[match.length - 1]
      )

      // Match for warning
      .replace(/(\d\s)?warning(s|:)?/gim, (match) => {
        // warning:
        if (match.endsWith(":")) {
          return (
            this.warning(match.substring(0, match.length - 1)) +
            match[match.length - 1]
          );
        }

        // 1 warning, 2 warnings
        return this.warning(match);
      })

      // Match until ':' from the start of the line: e.g SUBCOMMANDS:
      // TODO: Highlight the text from WASM so we don't have to do this.
      .replace(/^(.*?:)/gm, (match) => {
        if (
          (!match.includes("   ") && match.startsWith(" ")) ||
          match.startsWith("{")
        ) {
          return this.bold(match); // Indented
        }
        if (!match.toLowerCase().includes("error") && !match.includes("  ")) {
          return this.primary(match);
        }

        return match;
      })

      // Secondary text color for (...)
      .replace(/\(\d+\w+\)/gm, (match) => this.secondaryText(match))

      // Numbers
      .replace(/^\s*\d+$/, (match) => {
        return this.secondary(match);
      });

    return text;
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
    PgCommon.createAndDispatchCustomEvent(EventName.TERMINAL_STATE, {
      action,
    });
  }

  /**
   * Dispatch enable terminal custom event
   */
  static enable() {
    PgCommon.createAndDispatchCustomEvent(EventName.TERMINAL_ENABLE);
  }

  /**
   * Dispatch disable terminal custom event
   */
  static disable() {
    PgCommon.createAndDispatchCustomEvent(EventName.TERMINAL_DISABLE);
  }

  /**
   * Log terminal messages from anywhere
   *
   * Mainly used from WASM
   */
  static logWasm(msg: string) {
    PgCommon.createAndDispatchCustomEvent(EventName.TERMINAL_LOG, { msg });
  }

  /**
   * Dispatch scroll to bottom custom event
   */
  static scrollToBottom() {
    PgCommon.createAndDispatchCustomEvent(EventName.TERMINAL_SCROLL_TO_BOTTOM);
  }

  /**
   * Wrapper function for commands that interact with the terminal
   *
   * This function should be used as a wrapper function when calling any
   * terminal command.
   */
  static async runCmd<T>(cb: () => Promise<T>) {
    this.disable();
    this.scrollToBottom();
    try {
      return await cb();
    } catch (e: any) {
      this.logWasm(`Process error: ${e.message}`);
    } finally {
      this.enable();
    }
  }

  /**
   * Dispatch run last command custom event
   */
  static runLastCmd() {
    PgCommon.createAndDispatchCustomEvent(EventName.TERMINAL_RUN_LAST_CMD);
  }

  /**
   * Dispatch run cmd from str custom event
   */
  static runCmdFromStr(cmd: string) {
    PgCommon.createAndDispatchCustomEvent(
      EventName.TERMINAL_RUN_CMD_FROM_STR,
      cmd
    );
  }

  /**
   * Get terminal object from state as static
   *
   * @returns the terminal object in state
   */
  static async get<T, R extends PgTerm>() {
    return await PgCommon.sendAndReceiveCustomEvent<T, R>(
      PgCommon.getStaticEventNames(EventName.TERMINAL_STATIC).get
    );
  }

  /**
   * Run any method of terminal in state from anywhere
   *
   * @param data method and its data to run
   * @returns the result from the method call
   */
  static async run<
    M extends PgMethod<PgTerm>,
    R extends PgReturnType<PgTerm, keyof M>
  >(data: M) {
    return await PgCommon.sendAndReceiveCustomEvent<M, R>(
      PgCommon.getStaticEventNames(EventName.TERMINAL_STATIC).run,
      data
    );
  }

  /**
   * Redifined console.log for showing mocha logs in the playground terminal
   */
  static consoleLog(msg: string, ...rest: any[]) {
    if (msg !== undefined) {
      const fullMessage = format(msg, ...rest);
      _log(fullMessage);

      // We only want to log mocha logs to the terminal
      if (fullMessage.startsWith("  ")) {
        const editedMessage = fullMessage
          // Replace checkmark icon
          .replace(Emoji.CHECKMARK, PgTerminal.success("✔ "))
          // Make '1) testname' red
          .replace(/\s+\d\)\s\w*$/, (match) => PgTerminal.error(match))
          // Passing text
          .replace(/\d+\spassing/, (match) => PgTerminal.success(match))
          // Failing text
          .replace(/\d+\sfailing/, (match) => PgTerminal.error(match))
          // Don't show the stack trace because it shows the transpiled code
          // TODO: show where the error actually happened in user code
          .replace(/\s+at.*$/gm, "");

        PgTerminal.logWasm(editedMessage);
      }
    }
  }
}

// Keep the default console.log
const _log = console.log;

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

    // Load xterm addons
    this._webLinksAddon = new WebLinksAddon();
    this._fitAddon = new FitAddon();
    this._xterm.loadAddon(this._fitAddon);
    this._xterm.loadAddon(this._webLinksAddon);

    // Create  Shell and TTY
    this._pgTty = new PgTty(this._xterm);
    this._pgShell = new PgShell(this._pgTty);

    // XTerm events
    this._xterm.onResize(this._handleTermResize);
    this._xterm.onKey((keyEvent: { key: string; domEvent: KeyboardEvent }) => {
      if (keyEvent.key === " ") {
        keyEvent.domEvent.preventDefault();
        return false;
      }
    });
    // Any data event (key, paste...)
    this._xterm.onData(this._pgShell.handleTermData);

    this._isOpen = false;
  }

  open(container: HTMLElement) {
    this._container = container;

    this._xterm.open(container);
    this._xterm.attachCustomKeyEventHandler(this._handleCustomEvent);
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
   * Moves the command line to the top of the terminal screen
   *
   * This function does not clear previous history.
   */
  clear() {
    this._pgTty.clearTty();
    this._pgTty.print(`${PgTerminal.PROMPT_PREFIX}${this._pgTty.getInput()}`);
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
   * Wait for user input
   *
   * @param msg message to print to the terminal before prompting user
   * @returns user input
   */
  async waitForUserInput(msg: string) {
    return await this._pgShell.waitForUserInput(msg);
  }

  /**
   * Custom keyboard events. Only runs when terminal is in focus.
   *
   * @param e keyboard event
   * @returns whether to keep the defaults
   *
   * NOTE: This function is intentionally uses arrow functions for `this` to be
   * defined from the outer class (PgTerm) otherwise `this` is being defined from
   * XTerm's instance
   */
  private _handleCustomEvent = (e: KeyboardEvent) => {
    if (PgCommon.isKeyCtrlOrCmd(e) && e.type === "keydown") {
      const key = e.key.toUpperCase();

      switch (key) {
        case "C":
          if (e.shiftKey) {
            e.preventDefault();
            const selection = this._xterm.getSelection();
            navigator.clipboard.writeText(selection);
            return false;
          }

          return true;

        case "V":
          // Ctrl+Shift+V does not work with Firefox but works with Chromium.
          // We fallback to Ctrl+V for Firefox
          if (e.shiftKey || PgCommon.isFirefox()) return false;

          return true;

        case "L":
        case "M":
        case "J":
          return false;
      }
    }

    return true;
  };

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
